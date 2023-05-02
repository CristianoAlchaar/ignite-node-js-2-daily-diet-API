import { knex } from '../database'

function convertDate(dateString: string, timeString: string) {
  const regex = /(\d{2})\/(\d{2})\/(\d{4})/
  const match = dateString.match(regex)

  if (!match) {
    throw new Error('Invalid date format')
  }

  const day = Number(match[1])
  const month = Number(match[2]) - 1 // subtract 1 from month since Date object uses 0-indexed months
  const year = Number(match[3])

  const [hours, minutes] = timeString.split(':')

  const convertedDate = new Date(
    year,
    month,
    day,
    Number(hours),
    Number(minutes),
  )

  return convertedDate
}

export async function getBestSequenceOfMealsOnDiet(userId: string) {
  const meals = await knex('meals').where({
    userId,
  })

  const sortedMeals = meals.sort((a, b): number => {
    const aDate = convertDate(a.date, a.time).valueOf()
    const bDate = convertDate(b.date, b.time).valueOf()
    return aDate - bDate
  })

  let maxSequence = 0
  let currentSequence = 0

  for (const meal of sortedMeals) {
    if (meal.isOnDiet === 0) {
      // on database its store as 0 for false and 1 for true
      currentSequence = 0
    } else {
      currentSequence++
      if (currentSequence > maxSequence) {
        maxSequence = currentSequence
      }
    }
  }

  return maxSequence
}
