import { AttendeeRole, LiveSessionProvider, LiveSessionStatus, NotificationType } from '@prisma/client';
import { liveSessionRepository, LiveSessionListFilters } from '@repositories/liveSession.repository';
import { liveAttendeeRepository } from '@repositories/liveAttendee.repository';
import { enrollmentRepository } from '@repositories/enrollment.repository';
import { enrollmentService } from '@services/enrollment.service';
import { notificationService } from '@services/notification.service';
import { getLiveProvider } from '@lib/liveProviders';
import { NotFoundError, AuthorizationError, ValidationError } from '@utils/errors';
import { Role, STAFF_ROLES } from '@constants/roles.constant';
import { emitToLiveSession } from '@socket/ioInstance';
import { SocketEvent } from '@socket/socketEvents.constant';

interface ScheduleInput {
  title: string;
  description?: string;
  courseId?: string;
  provider?: LiveSessionProvider;
  scheduledStart: Date;
  scheduledEnd: Date;
  maxAttendees?: number;
}

interface ActorContext {
  actorId: string;
  roles: Role[];
}

function assertHostOrStaff(hostId: string, actor: ActorContext): void {
  const isStaff = actor.roles.some((role) => STAFF_ROLES.includes(role));
  if (hostId !== actor.actorId && !isStaff) {
    throw new AuthorizationError('Only the host or an admin can manage this live session');
  }
}

class LiveService {
  async schedule(input: ScheduleInput, actor: ActorContext) {
    if (input.scheduledEnd <= input.scheduledStart) {
      throw new ValidationError('scheduledEnd must be after scheduledStart');
    }

    const provider = getLiveProvider(input.provider);
    const room = await provider.createRoom({ roomName: input.title, title: input.title });

    const session = await liveSessionRepository.create({
      title: input.title,
      description: input.description,
      provider: input.provider ?? LiveSessionProvider.LIVEKIT,
      meetingId: room.meetingId,
      joinUrl: room.joinUrl,
      hostUrl: room.hostUrl,
      status: LiveSessionStatus.SCHEDULED,
      scheduledStart: input.scheduledStart,
      scheduledEnd: input.scheduledEnd,
      maxAttendees: input.maxAttendees,
      host: { connect: { id: actor.actorId } },
      ...(input.courseId ? { course: { connect: { id: input.courseId } } } : {}),
    });

    if (input.courseId) {
      const userIds = await enrollmentRepository.findActiveUserIdsForCourse(input.courseId);
      if (userIds.length > 0) {
        await notificationService.dispatch({
          userIds,
          type: NotificationType.LIVE_CLASS,
          title: 'New live class scheduled',
          body: `"${input.title}" is scheduled for ${input.scheduledStart.toLocaleString()}`,
          actionUrl: `/live/${session.id}`,
        });
      }
    }

    return session;
  }

  async getById(id: string) {
    const session = await liveSessionRepository.findById(id);
    if (!session) throw new NotFoundError('Live session');
    return session;
  }

  list(filters: LiveSessionListFilters) {
    return liveSessionRepository.findMany(filters);
  }

  async start(id: string, actor: ActorContext) {
    const session = await this.getById(id);
    assertHostOrStaff(session.hostId, actor);

    const updated = await liveSessionRepository.update(id, {
      status: LiveSessionStatus.LIVE,
      actualStart: new Date(),
    });

    emitToLiveSession(id, SocketEvent.LIVE_SESSION_STARTED, { sessionId: id });
    return updated;
  }

  async end(id: string, actor: ActorContext, recordingKey?: string) {
    const session = await this.getById(id);
    assertHostOrStaff(session.hostId, actor);

    const updated = await liveSessionRepository.update(id, {
      status: LiveSessionStatus.COMPLETED,
      actualEnd: new Date(),
      ...(recordingKey ? { recordingKey } : {}),
    });

    emitToLiveSession(id, SocketEvent.LIVE_SESSION_ENDED, { sessionId: id });
    return updated;
  }

  async cancel(id: string, actor: ActorContext) {
    const session = await this.getById(id);
    assertHostOrStaff(session.hostId, actor);
    return liveSessionRepository.update(id, { status: LiveSessionStatus.CANCELLED });
  }

  async join(id: string, actor: ActorContext, displayName: string) {
    const session = await this.getById(id);

    if (session.status === LiveSessionStatus.CANCELLED || session.status === LiveSessionStatus.COMPLETED) {
      throw new ValidationError(`Cannot join a session that is ${session.status.toLowerCase()}`);
    }

    const isHost = session.hostId === actor.actorId;
    const isStaff = actor.roles.some((role) => STAFF_ROLES.includes(role));

    if (!isHost && !isStaff && session.courseId) {
      const hasAccess = await enrollmentService.hasActiveEnrollment(actor.actorId, session.courseId);
      if (!hasAccess) throw new AuthorizationError('You must be enrolled in this course to join');
    }

    const role = isHost ? AttendeeRole.HOST : isStaff ? AttendeeRole.CO_HOST : AttendeeRole.ATTENDEE;
    await liveAttendeeRepository.upsertJoin(id, actor.actorId, role);

    const provider = getLiveProvider(session.provider);
    const token = provider.generateToken({
      roomName: session.meetingId ?? id,
      identity: actor.actorId,
      displayName,
      isHost: isHost || isStaff,
    });

    return { joinUrl: isHost ? session.hostUrl : session.joinUrl, token, role };
  }

  async leave(id: string, actor: ActorContext) {
    await liveAttendeeRepository.recordLeave(id, actor.actorId);
  }

  async getAttendance(id: string, actor: ActorContext) {
    const session = await this.getById(id);
    assertHostOrStaff(session.hostId, actor);
    return liveAttendeeRepository.findBySession(id);
  }
}

export const liveService = new LiveService();
