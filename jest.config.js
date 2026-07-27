/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/*.test.ts', '**/*.spec.ts'],
  moduleNameMapper: {
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@controllers/(.*)$': '<rootDir>/src/controllers/$1',
    '^@routes/(.*)$': '<rootDir>/src/routes/$1',
    '^@middlewares/(.*)$': '<rootDir>/src/middlewares/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@repositories/(.*)$': '<rootDir>/src/repositories/$1',
    '^@validators/(.*)$': '<rootDir>/src/validators/$1',
    '^@dto/(.*)$': '<rootDir>/src/dto/$1',
    '^@socket/(.*)$': '<rootDir>/src/socket/$1',
    '^@queues/(.*)$': '<rootDir>/src/queues/$1',
    '^@jobs/(.*)$': '<rootDir>/src/jobs/$1',
    '^@events/(.*)$': '<rootDir>/src/events/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@constants/(.*)$': '<rootDir>/src/constants/$1',
    '^@helpers/(.*)$': '<rootDir>/src/helpers/$1',
    '^@app-types/(.*)$': '<rootDir>/src/types/$1',
    '^@interfaces/(.*)$': '<rootDir>/src/interfaces/$1',
    '^@lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@emails/(.*)$': '<rootDir>/src/emails/$1',
    '^@storage/(.*)$': '<rootDir>/src/storage/$1',
  },
  setupFiles: ['<rootDir>/tests/setup.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/server.ts'],
  coverageDirectory: '<rootDir>/coverage',
  clearMocks: true,
  verbose: true,
  // Importing src/app.ts pulls in queue producers, which open real ioredis
  // connections at module-load time (by design — see queues/index.ts).
  // In CI/local runs without Redis available, those sockets keep retrying
  // in the background after tests finish; force the process to exit rather
  // than hang. Does not affect application code, only the test runner.
  forceExit: true,
};
