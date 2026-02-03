import type { ReactNode } from 'react';
import { MarketingHeader } from '@/components/MarketingHeader';
import { Newsbar } from '@/components/Newsbar';

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <Newsbar />
      <MarketingHeader />
      <div style={{ minHeight: 'calc(100vh - 56px)' }}>{children}</div>
    </div>
  );
}
