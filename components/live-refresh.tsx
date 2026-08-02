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

export function LiveRefresh() {
  const router = useRouter();

  useEffect(() => {
    if (!hasSupabaseBrowserConfig()) return;

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
      void supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
