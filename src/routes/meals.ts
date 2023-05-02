import { FastifyInstance } from 'fastify'
import { knex } from './../database'
import z from 'zod'

import { checkSessionIdExists } from '../middlewares/checkIfSessionIdExists'
import { randomUUID } from 'crypto'
import { getBestSequenceOfMealsOnDiet } from '../utils/getBestSequenceOfMealsOnDiet'

export async function mealsRoutes(app: FastifyInstance) {
  // display all meals
  app.get('/', { preHandler: [checkSessionIdExists] }, async () => {
    const meals = await knex('meals').select('*')

    return meals
  })

  // display all meals from a single user
  app.get(
    '/:userID',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const getMealParamsSchema = z.object({
        userID: z.string().uuid(),
      })

      const { userID } = getMealParamsSchema.parse(request.params)

      const meals = await knex('meals').where({
        userID,
      })

      if (meals.length === 0) {
        return reply.status(404).send()
      }

      return { meals }
    },
  )

  // display a single meal from a single user
  app.get(
    '/:userID/:mealID',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const getMealParamsSchema = z.object({
        userID: z.string().uuid(),
        mealID: z.string().uuid(),
      })

      const { userID, mealID } = getMealParamsSchema.parse(request.params)

      const meal = await knex('meals').where({
        userID,
        mealID,
      })

      if (meal.length === 0) {
        return reply.status(404).send()
      }

      return { meal }
    },
  )

  // create meal
  app.post(
    '/',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const createMealsBodySchema = z.object({
        name: z.string(),
        userID: z.string().uuid(),
        description: z.string(),
        date: z.string().length(10),
        time: z.string().length(5),
        isOnDiet: z.boolean(),
      })

      const { name, userID, description, date, time, isOnDiet } =
        createMealsBodySchema.parse(request.body)

      await knex('meals').insert({
        mealID: randomUUID(),
        name,
        userID,
        description,
        date,
        time,
        isOnDiet,
      })

      return reply.status(201).send()
    },
  )

  // edit meal
  app.put(
    '/:userID/:mealID',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const getMealParamsSchema = z.object({
        userID: z.string().uuid(),
        mealID: z.string().uuid(),
      })

      const updateMealBodySchema = z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        date: z.string().length(10).optional(),
        time: z.string().length(5).optional(),
        isOnDiet: z.boolean().optional(),
      })

      const { userID, mealID } = getMealParamsSchema.parse(request.params)
      const { name, description, date, time, isOnDiet } =
        updateMealBodySchema.parse(request.body)

      const result = await knex('meals')
        .where({
          userID,
          mealID,
        })
        .update({
          name,
          description,
          date,
          time,
          isOnDiet,
          updated_at: knex.fn.now(),
        })

      if (result === 0) {
        return reply.status(404).send()
      }

      return reply.status(200).send()
    },
  )

  // delete meal
  app.delete(
    '/:userID/:mealID',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const getMealParamsSchema = z.object({
        userID: z.string().uuid(),
        mealID: z.string().uuid(),
      })

      const { userID, mealID } = getMealParamsSchema.parse(request.params)

      const result = await knex('meals')
        .where({
          userID,
          mealID,
        })
        .del()

      if (result === 0) {
        return reply.status(404).send()
      }

      return reply.status(200).send()
    },
  )

  // get user metrics route
  app.get(
    '/info/:userID',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const getUserIDParamSchema = z.object({
        userID: z.string().uuid(),
      })

      const { userID } = getUserIDParamSchema.parse(request.params)

      const user = await knex('users')
        .where({
          id: userID,
        })
        .first()

      if (!user) {
        return reply.status(404).send({ error: 'User not found' })
      }

      const totalMeals = await knex('meals')
        .where({
          userID,
        })
        .count('*', { as: 'amount' })

      const totalMealsInDiet = await knex('meals')
        .where({
          userID,
        })
        .where('isOnDiet', true)
        .count('*', { as: 'amount' })

      const totalMealsOffDiet = await knex('meals')
        .where({
          userID,
        })
        .where('isOnDiet', false)
        .count('*', { as: 'amount' })

      const bestSequence = [
        { amount: await getBestSequenceOfMealsOnDiet(userID) },
      ]

      return { totalMeals, totalMealsInDiet, totalMealsOffDiet, bestSequence }
    },
  )
}
