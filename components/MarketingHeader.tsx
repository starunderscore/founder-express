import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@mantine/core';

export function MarketingHeader() {
  return (
    <nav style={nav}>
      <div style={navInner}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--mantine-color-text)' }}>
          <Image src="/icon/web/manifest-192.png" alt="Pattern Typing" width={24} height={24} />
          <span style={{ fontWeight: 700 }}>Pattern Typing</span>
        </Link>
        <Button component={Link} href="/account/signin" size="xs" variant="filled">
          Explore
        </Button>
      </div>
    </nav>
  );
}

const nav: React.CSSProperties = {
  borderBottom: '1px solid var(--mantine-color-gray-3)',
  height: 56,
  display: 'flex',
  alignItems: 'center',
  background: 'var(--mantine-color-body)',
};
const navInner: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: '100%',
  maxWidth: 1200,
  margin: '0 auto',
  width: '100%',
  padding: '0 1rem',
};
