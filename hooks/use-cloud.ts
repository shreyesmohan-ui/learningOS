"use client";
import { useEffect, useState } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { cloudClient } from "@/lib/cloud";
import type { CloudConfig } from "@/lib/cloud";
import { seedSQL } from "@/lib/curriculum";

export function useCloud() {
  const [client, setClient] = useState<SupabaseClient | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [config, setConfig] = useState<CloudConfig | null>(null);
  const [remoteSeed, setRemoteSeed] = useState<string | undefined>();
  const [status, setStatus] = useState("Connecting");
  useEffect(() => {
    let disposed = false;
    let unsubscribe: (() => void) | undefined;
    async function connect() {
      try {
        const response = await fetch("/api/config", { signal: AbortSignal.timeout(10000) });
        if (!response.ok) throw new Error();
        const values = await response.json() as CloudConfig;
        const connection = cloudClient(values);
        if (disposed) return;
        setConfig(values); setClient(connection);
        if (!connection) { setStatus("Local dataset"); return; }
        const { data: listener } = connection.auth.onAuthStateChange((_event, session) => { if (!disposed) setUser(session?.user ?? null); });
        unsubscribe = () => listener.subscription.unsubscribe();
        const { data, error } = await connection.from("learning_os_datasets").select("id,seed_sql").eq("id", values.datasetId).single();
        if (disposed) return;
        if (error || data?.seed_sql !== seedSQL) { setStatus("Local dataset: cloud version unavailable"); return; }
        setRemoteSeed(data.seed_sql); setStatus("Supabase dataset");
      } catch { if (!disposed) setStatus("Local dataset: offline"); }
    }
    void connect();
    return () => { disposed = true; unsubscribe?.(); };
  }, []);
  return { client, user, config, remoteSeed, status };
}
