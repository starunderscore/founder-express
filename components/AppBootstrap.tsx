"use client";
import { ReactNode } from "react";
import { useAuth } from "@/lib/firebase/auth";
import SplashScreen from "./SplashScreen";

export function AppBootstrap({ children }: { children: ReactNode }) {
  const { loading } = useAuth();

  if (loading) {
    return <SplashScreen />;
  }

  return <>{children}</>;
}

export default AppBootstrap;

