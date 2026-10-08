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
    const password = 'StrongPassword@123';
    const payload = {
      name: 'John Doe',
      email: `john-${Date.now()}@example.com`,
      password,
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

    const dbUser = await app.get(DatabaseService).query(
      'SELECT password FROM users WHERE email = $1',
      [payload.email],
    );

    expect(dbUser.rows[0].password).not.toBe(password);
    expect(dbUser.rows[0].password).toContain(':');

    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/userLogin')
      .send({ email: payload.email, password })
      .expect(201);

    expect(loginResponse.body.message).toBe('Login successful');
    expect(loginResponse.body.token).toBeTruthy();
    expect(loginResponse.body.user).toMatchObject({
      id: response.body.user.id,
      name: payload.name,
      email: payload.email,
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
