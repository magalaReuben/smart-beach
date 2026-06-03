import { z } from 'zod'

const configSchema = z.object({
  NEXT_PUBLIC_API_ENDPOINT: z.string(),
  NEXT_PUBLIC_URL: z.string(),
  NEXT_PUBLIC_SUPABASE_URL: z.string(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
})

const defaultValues =
  process.env.NODE_ENV !== 'production'
    ? {
        NEXT_PUBLIC_API_ENDPOINT: 'http://localhost:3000',
        NEXT_PUBLIC_URL: 'http://localhost:3000',
        NEXT_PUBLIC_SUPABASE_URL: '',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
      }
    : {}

const configProject = configSchema.safeParse({
  NEXT_PUBLIC_API_ENDPOINT:
    process.env.NEXT_PUBLIC_API_ENDPOINT || defaultValues.NEXT_PUBLIC_API_ENDPOINT,
  NEXT_PUBLIC_URL:
    process.env.NEXT_PUBLIC_URL || defaultValues.NEXT_PUBLIC_URL,
  NEXT_PUBLIC_SUPABASE_URL:
    process.env.NEXT_PUBLIC_SUPABASE_URL || defaultValues.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || defaultValues.NEXT_PUBLIC_SUPABASE_ANON_KEY,
})

if (!configProject.success) {
  console.error(configProject.error.issues)
  throw new Error('Required public environment variables are missing or invalid')
}

const envConfig = configProject.data

export default envConfig
