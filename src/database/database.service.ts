import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import pg from 'pg';
import { promises as fs } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const { Pool } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(DatabaseService.name);
    private pool: pg.Pool;

    constructor(private readonly configService: ConfigService) {
        const host = this.configService.get<string>('database.host');
        const isRemoteDb = !!host && !host.includes('localhost') && !host.includes('127.0.0.1');

        this.pool = new Pool({
            host,
            port: this.configService.get<number>('database.port'),
            user: this.configService.get<string>('database.user'),
            password: this.configService.get<string>('database.password'),
            database: this.configService.get<string>('database.name'),
            max: this.configService.get<number>('database.poolMax'),
            ssl: isRemoteDb ? { rejectUnauthorized: false } : false,
        });
    }

    async onModuleInit() {
        try {
            // Test DB connection
            const client = await this.pool.connect();
            client.release();
            this.logger.log('Connected to PostgreSQL successfully');

            // Execute schema DDL
            await this.runSchemaInit();
        } catch (error) {
            this.logger.error('Failed to connect to PostgreSQL', error);
            throw error;
        }
    }

    async onModuleDestroy() {
        await this.pool.end();
        this.logger.log('PostgreSQL connection pool closed');
    }

    async query<T extends pg.QueryResultRow = any>(text: string, params?: any[]): Promise<pg.QueryResult<T>> {
        return this.pool.query<T>(text, params);
    }

    private async runSchemaInit() {
        const schemaPath = resolve(__dirname, 'schema', 'schema.sql');
        try {
            const sql = await fs.readFile(schemaPath, 'utf-8');
            await this.query(sql);
            this.logger.log('Database schema synchronized');
        } catch (error) {
            this.logger.warn(`Could not run schema.sql automatically: ${(error as Error).message}`);
        }
    }
}
