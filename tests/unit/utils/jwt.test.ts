import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from '@utils/jwt';
import { Role } from '@constants/roles.constant';

describe('jwt utils', () => {
  it('signs and verifies an access token round-trip', () => {
    const token = signAccessToken({ sub: 'user-1', email: 'user@example.com', roles: [Role.STUDENT] });
    const payload = verifyAccessToken(token);

    expect(payload.sub).toBe('user-1');
    expect(payload.email).toBe('user@example.com');
    expect(payload.roles).toEqual([Role.STUDENT]);
    expect(payload.type).toBe('access');
  });

  it('signs and verifies a refresh token round-trip', () => {
    const token = signRefreshToken({ sub: 'user-1', jti: 'jti-123' }, false);
    const payload = verifyRefreshToken(token);

    expect(payload.sub).toBe('user-1');
    expect(payload.jti).toBe('jti-123');
    expect(payload.type).toBe('refresh');
  });

  it('rejects an access token when verified as a refresh token', () => {
    const accessToken = signAccessToken({ sub: 'user-1', email: 'user@example.com', roles: [Role.STUDENT] });
    expect(() => verifyRefreshToken(accessToken)).toThrow();
  });

  it('rejects a tampered token', () => {
    const token = signAccessToken({ sub: 'user-1', email: 'user@example.com', roles: [Role.STUDENT] });
    const tampered = `${token}tampered`;
    expect(() => verifyAccessToken(tampered)).toThrow();
  });
});
