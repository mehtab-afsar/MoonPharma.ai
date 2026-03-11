import { NextResponse } from "next/server"

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

export function errorResponse(message: string, status = 400, errors?: unknown) {
  return NextResponse.json({ success: false, message, errors }, { status })
}

export function unauthorizedResponse(message = "Unauthorized") {
  return errorResponse(message, 401)
}

export function forbiddenResponse(message = "Forbidden") {
  return errorResponse(message, 403)
}

export function notFoundResponse(message = "Not found") {
  return errorResponse(message, 404)
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number
) {
  return NextResponse.json({
    success: true,
    data,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  })
}
