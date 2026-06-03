import authApi from "@/apis/auth"
import { LoginBodyType } from "@/schemas/auth.schema"
import { cookies } from "next/headers"
import jwt from 'jsonwebtoken'
import { HttpError } from "@/lib/http"
import sqlite from '@/lib/sqlite'

 
export async function POST(request: Request) { 
    let body: any
    try {
        body = (await request.json()) as LoginBodyType
    } catch (err) {
        console.error('Invalid JSON body:', err)
        return Response.json({ message: 'Invalid JSON body' }, { status: 400 })
    }
    const cookieStore = await cookies()
    try { 
        // If USE_SQLITE is enabled, authenticate against local SQLite DB
        if (process.env.USE_SQLITE === 'true') {
            await sqlite.initDatabase()
            
            const user = sqlite.findAccountByEmail(body.email)
            if (!user) {
                return Response.json({ message: 'Invalid credentials' }, { status: 401 })
            }

            const valid = sqlite.verifyPassword(body.password, user.password)
            if (!valid) {
                return Response.json({ message: 'Invalid credentials' }, { status: 401 })
            }

            const payloadData = {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }

            const jwtSecret = process.env.JWT_SECRET || 'dev-secret'
            const accessToken = jwt.sign(payloadData, jwtSecret, { expiresIn: '15m' })
            const refreshToken = jwt.sign({ id: user.id }, jwtSecret, { expiresIn: '7d' })

            const decodeAccessToken = jwt.decode(accessToken) as { exp: number }
            const decodeRefreshToken = jwt.decode(refreshToken) as { exp: number }

            cookieStore.set('accessToken', accessToken, {
                path: '/',
                httpOnly: true,
                secure: true,
                sameSite: 'lax',
                expires: decodeAccessToken.exp * 1000
            })

            cookieStore.set('refreshToken', refreshToken, {
                path: '/',
                httpOnly: true,
                secure: true,
                sameSite: 'lax',
                expires: decodeRefreshToken.exp * 1000
            })

            const payload = {
                data: {
                    accessToken,
                    refreshToken,
                    account: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role
                    }
                },
                message: 'Login success'
            }

            return Response.json(payload)
        }

        const {payload} = await authApi.sLogin(body)
        const {data: {
            accessToken, refreshToken
        }} = payload

        const decodeAccessToken = jwt.decode(accessToken) as {exp: number}
        const decodeRefreshToken = jwt.decode(refreshToken) as {exp: number}

        cookieStore.set('accessToken', accessToken, {
            path: '/',
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            expires: decodeAccessToken.exp * 1000
        })

        cookieStore.set('refreshToken', refreshToken, {
            path: '/',
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            expires: decodeRefreshToken.exp * 1000
        })

        return Response.json(payload)
    } catch (error) {
        console.error('Auth login error:', error)
        if (error instanceof HttpError) {
            return Response.json(error.payload, {
                status: error.status,
            })
        } else {
            const message = (error && (error as any).message) || 'An error occurred during login'
            const stack = process.env.NODE_ENV !== 'production' ? (error && (error as any).stack) : undefined
            const payload: any = { message }
            if (stack) payload.stack = stack
            return Response.json(payload, { status: 500 })
        }
    }
   
}