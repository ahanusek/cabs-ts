process.env.DATABASE_HOST = process.env.TEST_DATABASE_HOST ?? '127.0.0.1';
process.env.DATABASE_PORT = process.env.TEST_DATABASE_PORT ?? '55432';
process.env.DATABASE_NAME = 'cabs_test';
process.env.DATABASE_USERNAME = 'postgres';
process.env.DATABASE_PASSWORD = 'cabs_test';
process.env.NODE_ENV = 'test';
