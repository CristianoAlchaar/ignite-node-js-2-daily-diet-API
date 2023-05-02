import { it, beforeAll, afterAll, describe, beforeEach } from 'vitest'
import { execSync } from 'node:child_process'
import request from 'supertest'
import { app } from '../src/app'

describe('Users Routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  // before each test, resets database
  beforeEach(() => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  it('should be able to create a new user', async () => {
    await request(app.server)
      .post('/users')
      .send({
        name: 'Test',
        email: 'test@example.com',
        password: '123456',
      })
      .expect(201)
  })

  it('should be able to login', async () => {
    // create a new user
    await request(app.server)
      .post('/users')
      .send({
        name: 'Test',
        email: 'test@example.com',
        password: '123456',
      })
      .expect(201)

    // login
    await request(app.server)
      .post('/users/login')
      .send({
        email: 'test@example.com',
        password: '123456',
      })
      .expect(200)
  })

  it('should be able to get userId and name', async () => {
    // create a new user
    await request(app.server)
      .post('/users')
      .send({
        name: 'Test',
        email: 'test@example.com',
        password: '123456',
      })
      .expect(201)

    // login
    const loginUserResponse = await request(app.server)
      .post('/users/login')
      .send({
        email: 'test@example.com',
        password: '123456',
      })
      .expect(200)

    const cookies = loginUserResponse.get('Set-Cookie')
    const sessionId = cookies[0].split(';')[0].split('=')[1]

    await request(app.server)
      .get('/users/' + sessionId)
      .set('Cookie', cookies)
      .expect(200)
  })

  it('should be able to list all users', async () => {
    // create a new user
    await request(app.server)
      .post('/users')
      .send({
        name: 'Test',
        email: 'test@example.com',
        password: 'testPassword',
      })
      .expect(201)

    // login
    const loginUserResponse = await request(app.server)
      .post('/users/login')
      .send({
        email: 'test@example.com',
        password: 'testPassword',
      })
      .expect(200)

    const cookies = loginUserResponse.get('Set-Cookie')

    // test list all users
    await request(app.server).get('/users').set('Cookie', cookies).expect(200)
  })
})
