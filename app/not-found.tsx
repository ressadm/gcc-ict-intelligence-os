import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-20 text-center">
        <div className="eyebrow text-ink-500">404</div>
        <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-ink-100">Brief not found</h1>
        <p className="mt-2 text-sm text-ink-400">
          That date is not in the archive.
        </p>
        <Link href="/" className="inline-block mt-6 text-xxs uppercase tracking-[0.18em] text-teal-bright hover:underline">
          ← Back to today
        </Link>
      </main>
      <Footer />
    </>
  );
}
