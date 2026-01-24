import Link from 'next/link';
import { getChapters } from '@/lib/reader';
import { AuthGate } from '@/components/AuthGate';

export default function ReaderIndexPage() {
  const chapters = getChapters();
  return (
    <AuthGate>
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 4 }}>Reader</h2>
        <p style={{ color: '#64748b', marginBottom: 12 }}>Browse chapters like a book.</p>
        <ul style={{ lineHeight: 1.8, paddingLeft: 18 }}>
          {chapters.map((ch) => (
            <li key={ch.slug}>
              <Link href={{ pathname: '/portal/reader/[slug]', query: { slug: ch.slug } }}>{ch.title}</Link>
            </li>
          ))}
        </ul>
      </div>
    </AuthGate>
  );
}
