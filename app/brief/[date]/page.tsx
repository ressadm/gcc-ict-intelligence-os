import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { BriefView } from '@/components/BriefView';
import { listBriefDates, loadBrief } from '@/lib/briefs';

export const dynamic = 'force-static';
export const dynamicParams = false;

export async function generateStaticParams() {
  const dates = await listBriefDates();
  return dates.map((date) => ({ date }));
}

export default async function BriefByDatePage({ params }: { params: { date: string } }) {
  const brief = await loadBrief(params.date);
  if (!brief) notFound();

  return (
    <>
      <Header briefDate={brief.date} generatedAt={brief.generated_at} />
      <main className="mx-auto max-w-6xl px-4 sm:px-6 pb-20">
        <BriefView brief={brief} />
      </main>
      <Footer />
    </>
  );
}
