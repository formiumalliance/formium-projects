// lib/utils/api-error.ts
// Centralized error handling for API routes

import { NextResponse } from 'next/server'

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function handleApiError(error: unknown): NextResponse {
  // Known API errors
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    )
  }

  // Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as { code: string; message: string }

    // Unique constraint violation
    if (prismaError.code === 'P2002') {
      return NextResponse.json(
        { error: 'A record with this value already exists.' },
        { status: 409 }
      )
    }

    // Record not found
    if (prismaError.code === 'P2025') {
      return NextResponse.json(
        { error: 'Record not found.' },
        { status: 404 }
      )
    }

    // Foreign key constraint
    if (prismaError.code === 'P2003') {
      return NextResponse.json(
        { error: 'Referenced record does not exist.' },
        { status: 400 }
      )
    }
  }

  // Zod validation errors (already handled inline, but catch any escaped ones)
  if (error instanceof Error && error.name === 'ZodError') {
    return NextResponse.json(
      { error: 'Validation failed', details: error.message },
      { status: 400 }
    )
  }

  // Generic server error — log but don't leak details
  console.error('[API Error]', error)
  return NextResponse.json(
    { error: 'An internal server error occurred. Please try again.' },
    { status: 500 }
  )
}

/**
 * Wraps an async API handler with unified error handling.
 * Usage:
 *   export const GET = withErrorHandler(async (req) => { ... })
 */
export function withErrorHandler<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args)
    } catch (error) {
      return handleApiError(error)
    }
  }
}
