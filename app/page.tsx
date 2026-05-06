import Link from 'next/link';
import { loadLatestBrief, loadLatestError, listBriefDates } from '@/lib/briefs';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { BriefView } from '@/components/BriefView';

export const dynamic = 'force-static';
export const revalidate = false;

export default async function HomePage() {
  const [brief, latestError, allDates] = await Promise.all([
    loadLatestBrief(),
    loadLatestError(),
    listBriefDates(),
  ]);

  return (
    <>
      <Header briefDate={brief?.date} generatedAt={brief?.generated_at} />
      <main className="mx-auto max-w-6xl px-4 sm:px-6 pb-20">
        {latestError ? (
          <div
            role="alert"
            className="mt-6 border border-signal-critical/40 bg-signal-critical/5 rounded-sm p-4 text-sm"
          >
            <div className="eyebrow text-signal-critical mb-1.5">Refresh failed</div>
            <p className="text-ink-200 leading-relaxed">
              The most recent refresh attempt failed at <span className="font-mono">{latestError.stage}</span> on{' '}
              <span className="font-mono">{latestError.date}</span> after {latestError.attempts} attempt(s).
              The previous brief below remains intact.
            </p>
            <p className="mt-2 text-xs text-ink-400 font-mono break-words">{latestError.message}</p>
          </div>
        ) : null}

        {brief ? (
          <BriefView brief={brief} />
        ) : (
          <div className="mt-16 text-center">
            <h1 className="text-xl font-semibold text-ink-100">No brief available yet</h1>
            <p className="mt-2 text-sm text-ink-400">
              Run <code className="font-mono text-teal-bright">npm run refresh-brief</code> with{' '}
              <code className="font-mono text-teal-bright">PERPLEXITY_API_KEY</code> set, or wait for the next scheduled refresh.
            </p>
            <p className="mt-1 text-xs text-ink-600">{allDates.length} archived brief(s) found.</p>
            {allDates.length > 0 ? (
              <Link href="/archive" className="inline-block mt-4 text-xxs uppercase tracking-[0.18em] text-teal-bright hover:underline">
                Browse archive →
              </Link>
            ) : null}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
