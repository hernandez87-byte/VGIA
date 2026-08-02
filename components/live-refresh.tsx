"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createClient,
  hasSupabaseBrowserConfig,
} from "@/lib/supabase/client";

const LIVE_TABLES = [
  "emergency_events",
  "hazard_zones",
  "resources",
  "road_closures",
] as const;

const NEWS_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export function LiveRefresh() {
  const router = useRouter();

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, NEWS_REFRESH_INTERVAL_MS);

    if (!hasSupabaseBrowserConfig()) {
      return () => window.clearInterval(intervalId);
    }

    const supabase = createClient();
    let channel = supabase.channel("vigia-dashboard-live");

    LIVE_TABLES.forEach((table) => {
      channel = channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => router.refresh(),
      );
    });

    channel.subscribe();

    return () => {
      window.clearInterval(intervalId);
      void supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
