import { NextResponse } from 'next/server'

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.code, message: error.message },
      { status: error.statusCode }
    )
  }

  console.error('Unhandled error:', error)
  return NextResponse.json(
    { error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    { status: 500 }
  )
}
