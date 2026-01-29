"use client";
import type { ReactNode } from 'react';
import { Container, Paper, Group, Badge, ActionIcon } from '@mantine/core';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FloatingGradients } from '@/components/FloatingGradients';

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', position: 'relative', background: 'linear-gradient(180deg, #0b1020 0%, #0a0e1a 100%)' }}>
      <FloatingGradients />
      <Container size={480} pt={40} pb={60} style={{ position: 'relative', zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: 'easeOut' }}>
          <Paper shadow="xl" radius="lg" p="lg" withBorder>
            <Group justify="space-between" mb="xs">
              <Group gap={8}>
                <ActionIcon variant="subtle" aria-label="Back" component={Link as any} href="/">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11 19l-7-7 7-7v4h8v6h-8v4z" fill="currentColor"/>
                  </svg>
                </ActionIcon>
                <Badge variant="light" color="indigo">Founder Frame</Badge>
              </Group>
            </Group>
            {children}
          </Paper>
        </motion.div>
      </Container>
    </div>
  );
}
