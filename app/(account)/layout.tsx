"use client";
import type { ReactNode } from 'react';
import { Container, Center, Title, Text, Paper, Stack } from '@mantine/core';
import { motion } from 'framer-motion';
import { FloatingGradients } from '@/components/FloatingGradients';

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', position: 'relative', background: 'linear-gradient(180deg, #0b1020 0%, #0a0e1a 100%)' }}>
      <FloatingGradients />
      <Container size={480} pt={40} pb={60} style={{ position: 'relative', zIndex: 1 }}>
        <Center>
          <Stack gap={2} align="center" mb={16}>
            <Title order={3}>Pattern Typing</Title>
            <Text c="dimmed" size="sm">Account</Text>
          </Stack>
        </Center>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: 'easeOut' }}>
          <Paper shadow="xl" radius="lg" p="lg" withBorder>
            {children}
          </Paper>
        </motion.div>
      </Container>
    </div>
  );
}
