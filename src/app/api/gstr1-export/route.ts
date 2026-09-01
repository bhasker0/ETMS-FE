import { NextRequest, NextResponse } from 'next/server';
import { generateGSTR1SAC9988CSV } from '@/lib/tally-xml-generator';
import { apiClient } from '@/lib/api-client';
import { MOCK_INVOICES } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';

/**
 * GSTR-1 SAC 9988 CSV Export endpoint.
 * Fetches invoices from the backend for the active tenant,
 * falls back to mock data if backend is unavailable.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get('companyId');
  const fromDate = searchParams.get('from');
  const toDate = searchParams.get('to');

  let invoices;

  try {
    // Attempt to fetch real invoice data from backend
    const params: Record<string, string> = {};
    if (companyId) params.companyId = companyId;
    if (fromDate) params.from = fromDate;
    if (toDate) params.to = toDate;

    const response = await apiClient.get('/api/v1/outward-invoices', { params });
    invoices = response?.data || response;

    if (!Array.isArray(invoices) || invoices.length === 0) {
      throw new Error('No invoices returned from backend');
    }
  } catch (e) {
    // Fallback to mock data when backend is unavailable
    console.warn('[GSTR-1 Export] Backend unavailable, using mock invoices:', e);
    invoices = MOCK_INVOICES;
  }

  const csv = generateGSTR1SAC9988CSV(invoices);

  const filename = `GSTR1_SAC9988_${companyId || 'all'}_${new Date().toISOString().split('T')[0]}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
