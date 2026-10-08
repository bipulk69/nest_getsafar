import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { DatabaseService } from './../src/database/database.service.js';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    const db = app.get(DatabaseService);
    await db.query('DELETE FROM users');
  });

  it('/api/v1 (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1')
      .expect(200)
      .expect('Hello World!');
  });

  it('POST /api/v1/auth/creatUser should create a user', async () => {
    const payload = {
      name: 'John Doe',
      email: `john-${Date.now()}@example.com`,
    };

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/creatUser')
      .send(payload)
      .expect(201);

    expect(response.body.message).toBe('User created successfully');
    expect(response.body.token).toBeTruthy();
    expect(response.body.expiresIn).toBe('24h');
    expect(response.body.user).toMatchObject({
      name: payload.name,
      email: payload.email,
    });
    expect(response.body.user.id).toBeTruthy();
  });

  afterEach(async () => {
    await app.close();
  });
});
