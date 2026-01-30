import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@mantine/core';

export function MarketingHeader() {
  return (
    <nav style={nav}>
      <div style={navInner}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 16 }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#fff' }}>
            <Image src="/icon/web/manifest-192.png" alt="Founder Express" width={24} height={24} />
            <span style={{ fontWeight: 700 }}>Founder Express</span>
          </Link>
          <Link href="/blogs" style={{ color: '#e5e7eb', textDecoration: 'none', fontWeight: 500 }}>
            Blog
          </Link>
        </div>
        <Button component={Link} href="/account/signin" size="xs" variant="white" styles={{
          root: { background: '#fff', color: '#111', border: '1px solid rgba(255,255,255,0.2)' }
        } as any}>
          Explore
        </Button>
      </div>
    </nav>
  );
}

const nav: React.CSSProperties = {
  borderBottom: '1px solid rgba(255,255,255,0.12)',
  height: 56,
  display: 'flex',
  alignItems: 'center',
  background: '#0b0f19',
};
const navInner: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: '100%',
  maxWidth: 960,
  margin: '0 auto',
  width: '100%',
  padding: '0 1rem',
};
