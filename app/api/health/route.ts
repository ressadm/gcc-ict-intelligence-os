import { NextResponse } from 'next/server';
import { listBriefDates, loadLatestError } from '@/lib/briefs';

export const dynamic = 'force-static';

export async function GET() {
  const [dates, latestError] = await Promise.all([listBriefDates(), loadLatestError()]);
  return NextResponse.json({
    ok: true,
    brief_count: dates.length,
    latest_brief: dates[0] ?? null,
    latest_error: latestError,
  });
}
