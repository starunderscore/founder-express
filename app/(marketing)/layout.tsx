import type { ReactNode } from 'react';
import { MarketingHeader } from '@/components/MarketingHeader';

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <MarketingHeader />
      <div style={{ minHeight: 'calc(100vh - 56px)' }}>{children}</div>
    </div>
  );
}

