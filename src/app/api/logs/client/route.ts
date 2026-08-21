import { NextRequest, NextResponse } from 'next/server';

// In-memory ring buffer for client diagnostic logs
const clientLogsRingBuffer: any[] = [];
const MAX_LOGS = 200;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const incomingLogs = body.logs || [];

    if (Array.isArray(incomingLogs)) {
      incomingLogs.forEach((log) => {
        clientLogsRingBuffer.push(log);
        if (clientLogsRingBuffer.length > MAX_LOGS) {
          clientLogsRingBuffer.shift();
        }
      });
    }

    return NextResponse.json({
      status: 'ok',
      received: incomingLogs.length,
      bufferSize: clientLogsRingBuffer.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 400 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    count: clientLogsRingBuffer.length,
    logs: clientLogsRingBuffer,
  });
}
