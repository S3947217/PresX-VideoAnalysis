"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { SubscriptionStatus } from "@/types/project";
import { getSubscriptionStatus } from "@/lib/api";

interface SubscriptionContextValue {
  subscription: SubscriptionStatus | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextValue>({
  subscription: null,
  isLoading: true,
  refresh: async () => {},
});

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const status = await getSubscriptionStatus();
      setSubscription(status);
    } catch (err) {
      console.error("Failed to fetch subscription status:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <SubscriptionContext.Provider value={{ subscription, isLoading, refresh }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
