import { NextRequest, NextResponse } from 'next/server';
import { generateTallyPrimeSalesXML } from '@/lib/tally-xml-generator';
import { MOCK_INVOICES } from '@/lib/mock-data';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const company = searchParams.get('company') || 'SHREE GANESH EMBROIDERY';
  const startDate = searchParams.get('startDate') || '2026-08-01';
  const endDate = searchParams.get('endDate') || '2026-08-31';

  const xml = generateTallyPrimeSalesXML(company, MOCK_INVOICES, startDate, endDate);

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Content-Disposition': `attachment; filename="TallyPrime_Sales_SAC9988_${startDate}.xml"`,
    },
  });
}
