"use client";
import { Center, Loader, Stack, Text } from "@mantine/core";

export function SplashScreen() {
  return (
    <Center style={{ minHeight: "100dvh" }}>
      <Stack align="center" gap={4}>
        <Loader size="sm" />
        <Text c="dimmed" size="sm">Loading…</Text>
      </Stack>
    </Center>
  );
}

export default SplashScreen;
