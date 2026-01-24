"use client";
import { Button } from '@mantine/core';
import { useSessionStore } from '@/state/store';
import { ActionOrigin } from '@/state/events';

export function PracticeFromCode({ code }: { code: string }) {
  const dispatch = useSessionStore((s) => s.dispatch);
  const startPractice = () => {
    dispatch({ type: 'input/setText', text: code, cursorAt: 'start', origin: ActionOrigin.User });
  };
  return (
    <Button size="xs" variant="default" onClick={startPractice}>Practice this block</Button>
  );
}

