import { it, beforeAll, afterAll, describe, beforeEach, expect } from 'vitest'
import { execSync } from 'node:child_process'
import request from 'supertest'
import { app } from '../src/app'

describe('Meals Routes', () => {
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

  it('should be able to register a new meal', async () => {
    // create user
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

    // get user id
    const sessionId = cookies[0].split(';')[0].split('=')[1]

    const userData = await request(app.server)
      .get('/users/' + sessionId)
      .set('Cookie', cookies)
      .expect(200)

    const { userId } = userData.body

    await request(app.server)
      .post('/meals')
      .set('Cookie', cookies)
      .send({
        name: 'Comida teste',
        userID: userId,
        description: 'Testando',
        date: '02/05/2023',
        time: '10:08',
        isOnDiet: true,
      })
      .expect(201)
  })

  it('should be able to get meals from user', async () => {
    // create user
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

    // get user id
    const sessionId = cookies[0].split(';')[0].split('=')[1]

    const userData = await request(app.server)
      .get('/users/' + sessionId)
      .set('Cookie', cookies)
      .expect(200)

    const { userId } = userData.body

    // create meal
    await request(app.server)
      .post('/meals')
      .set('Cookie', cookies)
      .send({
        name: 'Comida teste',
        userID: userId,
        description: 'Testando',
        date: '02/05/2023',
        time: '10:08',
        isOnDiet: true,
      })
      .expect(201)

    // getMealsFromUser
    const getMealResponse = await request(app.server)
      .get('/meals/' + userId)
      .set('Cookie', cookies)
      .expect(200)

    const { meals } = getMealResponse.body

    expect(meals.length > 0)
  })

  it('should be able to get info from user', async () => {
    // create user
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

    // get user id
    const sessionId = cookies[0].split(';')[0].split('=')[1]

    const userData = await request(app.server)
      .get('/users/' + sessionId)
      .set('Cookie', cookies)
      .expect(200)

    const { userId } = userData.body

    // getInfoFromUser
    await request(app.server)
      .get('/meals/info/' + userId)
      .set('Cookie', cookies)
      .expect(200)
  })

  it('should be able to get all meals from database', async () => {
    // create user
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

    await request(app.server).get('/meals').set('Cookie', cookies).expect(200)
  })

  it('should be able to get meal by id from user', async () => {
    // create user
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

    // get user id
    const sessionId = cookies[0].split(';')[0].split('=')[1]

    const userData = await request(app.server)
      .get('/users/' + sessionId)
      .set('Cookie', cookies)
      .expect(200)

    const { userId } = userData.body

    // create meal
    await request(app.server)
      .post('/meals')
      .set('Cookie', cookies)
      .send({
        name: 'Comida teste',
        userID: userId,
        description: 'Testando',
        date: '02/05/2023',
        time: '10:08',
        isOnDiet: true,
      })
      .expect(201)

    // getMealsFromUser
    const getMealResponse = await request(app.server)
      .get('/meals/' + userId)
      .set('Cookie', cookies)
      .expect(200)

    const { meals } = getMealResponse.body

    expect(meals.length > 0)

    // find meal by id
    const mealId = meals[0].mealId

    await request(app.server)
      .get(`/meals/${userId}/${mealId}`)
      .set('Cookie', cookies)
      .expect(200)
  })

  it('should be able to edit meal from user', async () => {
    // create user
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

    // get user id
    const sessionId = cookies[0].split(';')[0].split('=')[1]

    const userData = await request(app.server)
      .get('/users/' + sessionId)
      .set('Cookie', cookies)
      .expect(200)

    const { userId } = userData.body

    // create meal
    await request(app.server)
      .post('/meals')
      .set('Cookie', cookies)
      .send({
        name: 'Comida teste',
        userID: userId,
        description: 'Testando',
        date: '02/05/2023',
        time: '10:08',
        isOnDiet: true,
      })
      .expect(201)

    // getMealsFromUser
    const getMealResponse = await request(app.server)
      .get('/meals/' + userId)
      .set('Cookie', cookies)
      .expect(200)

    const { meals } = getMealResponse.body

    expect(meals.length > 0)

    // find meal by id
    const mealId = meals[0].mealId

    await request(app.server)
      .put(`/meals/${userId}/${mealId}`)
      .set('Cookie', cookies)
      .send({
        isOnDiet: true,
      })
      .expect(200)
  })

  it('should be able to delete meal from user', async () => {
    // create user
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

    // get user id
    const sessionId = cookies[0].split(';')[0].split('=')[1]

    const userData = await request(app.server)
      .get('/users/' + sessionId)
      .set('Cookie', cookies)
      .expect(200)

    const { userId } = userData.body

    // create meal
    await request(app.server)
      .post('/meals')
      .set('Cookie', cookies)
      .send({
        name: 'Comida teste',
        userID: userId,
        description: 'Testando',
        date: '02/05/2023',
        time: '10:08',
        isOnDiet: true,
      })
      .expect(201)

    // getMealsFromUser
    const getMealResponse = await request(app.server)
      .get('/meals/' + userId)
      .set('Cookie', cookies)
      .expect(200)

    const { meals } = getMealResponse.body

    expect(meals.length > 0)

    // find meal by id
    const mealId = meals[0].mealId

    await request(app.server)
      .delete(`/meals/${userId}/${mealId}`)
      .set('Cookie', cookies)
      .expect(200)
  })
})
