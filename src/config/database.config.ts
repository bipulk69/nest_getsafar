import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgrespassword',
    name: process.env.DB_NAME || 'getsafar_db',
    poolMax: parseInt(process.env.DB_POOL_MAX || '10', 10),
}));
