import { userRepository } from '@repositories/user.repository';
import { refreshTokenRepository } from '@repositories/refreshToken.repository';
import { authService } from '@services/auth.service';
import { AuthenticationError, ConflictError } from '@utils/errors';
import * as hashUtils from '@utils/hash';

jest.mock('@repositories/user.repository');
jest.mock('@repositories/refreshToken.repository');
jest.mock('@services/otp.service', () => ({ otpService: { generateAndSend: jest.fn().mockResolvedValue(undefined) } }));
jest.mock('@queues/producers/email.producer', () => ({ enqueueEmail: jest.fn().mockResolvedValue(undefined) }));

const mockedUserRepo = userRepository as jest.Mocked<typeof userRepository>;
const mockedRefreshTokenRepo = refreshTokenRepository as jest.Mocked<typeof refreshTokenRepository>;

function fakeUserWithRoles(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'user-1',
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
    passwordHash: 'hashed-password',
    avatarKey: null,
    status: 'ACTIVE',
    isEmailVerified: true,
    createdAt: new Date(),
    roles: [{ role: { name: 'STUDENT' } }],
    ...overrides,
  } as never;
}

describe('AuthService', () => {
  afterEach(() => jest.clearAllMocks());

  describe('register', () => {
    it('throws ConflictError when the email is already registered', async () => {
      mockedUserRepo.findByEmail.mockResolvedValue(fakeUserWithRoles());

      await expect(
        authService.register({ firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com', password: 'Passw0rd!' }),
      ).rejects.toBeInstanceOf(ConflictError);

      expect(mockedUserRepo.create).not.toHaveBeenCalled();
    });

    it('creates a new user with the STUDENT role and issues tokens', async () => {
      mockedUserRepo.findByEmail.mockResolvedValue(null);
      mockedUserRepo.create.mockResolvedValue(fakeUserWithRoles());
      mockedRefreshTokenRepo.create.mockResolvedValue({} as never);

      const result = await authService.register({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        password: 'Passw0rd!',
      });

      expect(mockedUserRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'jane@example.com', roleNames: ['STUDENT'] }),
      );
      expect(result.tokens.accessToken).toEqual(expect.any(String));
      expect(result.tokens.refreshToken).toEqual(expect.any(String));
      expect(result.user.email).toBe('jane@example.com');
    });
  });

  describe('login', () => {
    it('rejects when the user does not exist', async () => {
      mockedUserRepo.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({ email: 'nobody@example.com', password: 'whatever' }, {}),
      ).rejects.toBeInstanceOf(AuthenticationError);
    });

    it('rejects an incorrect password', async () => {
      mockedUserRepo.findByEmail.mockResolvedValue(fakeUserWithRoles());
      jest.spyOn(hashUtils, 'comparePassword').mockResolvedValue(false);

      await expect(
        authService.login({ email: 'jane@example.com', password: 'wrong-password' }, {}),
      ).rejects.toBeInstanceOf(AuthenticationError);
    });

    it('rejects a suspended account even with the correct password', async () => {
      mockedUserRepo.findByEmail.mockResolvedValue(fakeUserWithRoles({ status: 'SUSPENDED' }));
      jest.spyOn(hashUtils, 'comparePassword').mockResolvedValue(true);

      await expect(
        authService.login({ email: 'jane@example.com', password: 'Passw0rd!' }, {}),
      ).rejects.toBeInstanceOf(AuthenticationError);
    });

    it('issues tokens and records login on success', async () => {
      mockedUserRepo.findByEmail.mockResolvedValue(fakeUserWithRoles());
      mockedUserRepo.recordLogin.mockResolvedValue(undefined);
      mockedRefreshTokenRepo.create.mockResolvedValue({} as never);
      jest.spyOn(hashUtils, 'comparePassword').mockResolvedValue(true);

      const result = await authService.login({ email: 'jane@example.com', password: 'Passw0rd!' }, { ipAddress: '1.2.3.4' });

      expect(mockedUserRepo.recordLogin).toHaveBeenCalledWith('user-1', '1.2.3.4');
      expect(result.tokens.accessToken).toEqual(expect.any(String));
    });
  });
});
