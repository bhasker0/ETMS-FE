import { NextResponse } from 'next/server';

/**
 * Health check endpoint for Docker healthcheck and monitoring.
 * Returns application status, version, and timestamp.
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      app: process.env.NEXT_PUBLIC_APP_NAME || 'ETMS Surat',
      uptime: process.uptime(),
    },
    { status: 200 }
  );
}
