import { z } from 'zod'

const configSchema = z.object({
  NEXT_PUBLIC_API_ENDPOINT: z.string(),
  NEXT_PUBLIC_URL: z.string(),
})

const defaultValues =
  process.env.NODE_ENV !== 'production'
    ? {
        NEXT_PUBLIC_API_ENDPOINT: 'http://localhost:3000',
        NEXT_PUBLIC_URL: 'http://localhost:3000',
      }
    : {}

const configProject = configSchema.safeParse({
  NEXT_PUBLIC_API_ENDPOINT:
    process.env.NEXT_PUBLIC_API_ENDPOINT || defaultValues.NEXT_PUBLIC_API_ENDPOINT,
  NEXT_PUBLIC_URL:
    process.env.NEXT_PUBLIC_URL || defaultValues.NEXT_PUBLIC_URL,
})

if (!configProject.success) {
  console.error(configProject.error.issues)
  throw new Error('Required public environment variables are missing or invalid')
}

const envConfig = configProject.data

export default envConfig