process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ||= 'postgresql://postgres:postgres@localhost:5432/edtech_lms_test?schema=public';
process.env.JWT_SECRET ||= 'test-jwt-secret-key-not-for-production';
process.env.JWT_REFRESH_SECRET ||= 'test-jwt-refresh-secret-key-not-for-production';
process.env.REDIS_URL ||= 'redis://localhost:6379/1';
process.env.AWS_S3_BUCKET ||= 'test-bucket';
process.env.AWS_REGION ||= 'us-east-1';
process.env.LOG_LEVEL = 'silent';
