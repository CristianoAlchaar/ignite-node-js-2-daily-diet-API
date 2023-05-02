import { FastifyInstance } from 'fastify'
import { knex } from './../database'

import z from 'zod'
import { randomUUID } from 'crypto'
import { hash, compare } from 'bcrypt'
import { checkSessionIdExists } from '../middlewares/checkIfSessionIdExists'
import { userT } from '../@types/user'

export async function userRoutes(app: FastifyInstance) {
  // display all users
  app.get('/', { preHandler: [checkSessionIdExists] }, async () => {
    const users = await knex('users').select('*')

    return users
  })

  // get user by session id
  app.get(
    '/:sessionId',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const getMealParamsSchema = z.object({
        sessionId: z.string().uuid(),
      })

      const { sessionId } = getMealParamsSchema.parse(request.params)

      const session_id = sessionId

      const user: userT[] = await knex('users').where({
        session_id,
      })

      if (user.length === 0) {
        return reply.status(404).send()
      }

      const { id, name } = user[0]

      return { userId: id, name }
    },
  )

  // create user
  app.post('/', async (request, reply) => {
    const createUserBodySchema = z.object({
      name: z.string(),
      email: z.string(),
      password: z.string(),
    })

    const { name, email, password } = createUserBodySchema.parse(request.body)

    const hashedPassword = await hash(password, 10)

    await knex('users').insert({
      id: randomUUID(),
      name,
      email,
      password: hashedPassword,
    })

    return reply.status(201).send()
  })

  // Login route
  app.post('/login', async (request, reply) => {
    const createLoginBodySchema = z.object({
      email: z.string(),
      password: z.string(),
    })

    const { email, password } = createLoginBodySchema.parse(request.body)

    // Check if email and password are valid
    const user = await knex('users').where({ email }).first()

    if (!user) {
      return reply.status(401).send({ error: 'Invalid username or password' })
    }

    // Compare the password with the hashed password in the database
    const isPasswordValid = await compare(password, user.password)

    if (!isPasswordValid) {
      return reply.status(401).send({ error: 'Invalid username or password' })
    }

    // Generate a new session ID
    const sessionId = randomUUID()

    // Update the user record with the new session ID
    await knex('users').where({ id: user.id }).update({ session_id: sessionId })

    // Set the session ID as a cookie in the response
    reply.cookie('sessionId', sessionId, {
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    })

    return reply.status(200).send({ message: 'Session created' })
  })
}
