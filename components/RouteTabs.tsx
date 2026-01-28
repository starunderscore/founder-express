"use client";
import { Tabs } from "@mantine/core";
import { useRouter } from "next/navigation";
import React from "react";

export type RouteTab = {
  value: string;
  label: React.ReactNode;
  href: string;
};

type RouteTabsProps = {
  value: string;
  tabs: RouteTab[];
  radius?: React.ComponentProps<typeof Tabs>["radius"];
  mb?: React.ComponentProps<typeof Tabs>["mb"];
};

export function RouteTabs({ value, tabs, radius = "md", mb }: RouteTabsProps) {
  const router = useRouter();

  const handleChange = (next: string | null) => {
    if (!next) return;
    const t = tabs.find((x) => x.value === next);
    if (t) router.push(t.href);
  };

  return (
    <Tabs value={value} onChange={handleChange} radius={radius} mb={mb}>
      <Tabs.List>
        {tabs.map((t) => (
          <Tabs.Tab key={t.value} value={t.value}>
            {t.label}
          </Tabs.Tab>
        ))}
      </Tabs.List>
    </Tabs>
  );
}

