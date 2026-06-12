import { NextRequest, NextResponse } from "next/server";
import { AppError } from "@/lib/errors";
import { log } from "@/lib/log";

type ApiSuccess<T> = { ok: true; data: T };
type ApiErrorResponse = {
  ok: false;
  error: { code: string; message: string; fields?: Record<string, string> };
};
export type ApiResponse<T> = ApiSuccess<T> | ApiErrorResponse;

/**
 * Wraps any async handler to provide consistent error mapping.
 * Works with any function signature — just catches errors from the wrapped fn.
 */
export async function handleApiErrors<T>(
  fn: () => Promise<NextResponse<T>>,
  req: NextRequest,
): Promise<NextResponse> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json(
        { ok: false, error: { code: err.code, message: err.message, fields: err.fields } },
        { status: err.httpStatus },
      );
    }

    log.error({ err, url: req.url, method: req.method }, "Unhandled error in API handler");

    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 },
    );
  }
}
