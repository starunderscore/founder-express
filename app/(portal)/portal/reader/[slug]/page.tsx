import { AuthGate } from '@/components/AuthGate';
import { getChapter } from '@/lib/reader';
import { notFound } from 'next/navigation';
import { PracticeFromCode } from '@/components/PracticeFromCode';

export default function ChapterPage({ params }: { params: { slug: string } }) {
  const data = getChapter(params.slug);
  if (!data) return notFound();

  return (
    <AuthGate>
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{data.title}</h2>
          <p style={{ color: '#64748b', margin: 0 }}>Markdown chapter</p>
        </div>
        <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
          <div dangerouslySetInnerHTML={{ __html: data.html }} />
        </div>
        {data.codeBlocks.length > 0 && (
          <div>
            <hr style={{ border: 0, borderTop: '1px solid #e2e8f0', margin: '12px 0' }} />
            <h4 style={{ margin: '8px 0' }}>Practice blocks</h4>
            <div style={{ display: 'grid', gap: 8 }}>
              {data.codeBlocks.map((code, i) => (
                <div key={i}>
                  <PracticeFromCode code={code} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AuthGate>
  );
}
