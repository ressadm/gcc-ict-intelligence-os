import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { loadAllBriefs } from '@/lib/briefs';
import { ArchiveBrowser } from './ArchiveBrowser';

export const dynamic = 'force-static';
export const revalidate = false;

export default async function ArchivePage() {
  const briefs = await loadAllBriefs();
  // Strip down the data to a small, searchable index.
  const index = briefs.map((b) => ({
    date: b.date,
    title: b.title,
    executive_summary: b.executive_summary,
    signals: b.top_signals.map((s) => ({
      id: s.id,
      headline: s.headline,
      summary: s.summary,
      domains: s.domains,
      layers: s.layers,
      signal_type: s.signal_type,
    })),
  }));

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 sm:px-6 pb-20">
        <header className="pt-6 sm:pt-10 mb-6">
          <div className="eyebrow text-ink-500">Archive</div>
          <h1 className="mt-1.5 text-2xl sm:text-3xl font-semibold tracking-tightest text-ink-100">
            Brief Archive
          </h1>
          <p className="mt-1.5 text-sm text-ink-500">
            Search across every brief published. Click any signal to open its full brief.
          </p>
        </header>
        <ArchiveBrowser index={index} />
      </main>
      <Footer />
    </>
  );
}
