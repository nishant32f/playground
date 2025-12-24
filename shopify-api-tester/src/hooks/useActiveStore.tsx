"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

export interface Store {
  id: string;
  name: string;
  storeUrl: string;
  scopes: string;
  apiVersion: string;
  isActive: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ActiveStoreContextType {
  activeStore: Store | null;
  stores: Store[];
  setActiveStore: (store: Store) => Promise<void>;
  refreshStores: () => Promise<void>;
  isLoading: boolean;
}

const ActiveStoreContext = createContext<ActiveStoreContextType | undefined>(
  undefined
);

export function ActiveStoreProvider({ children }: { children: ReactNode }) {
  const [activeStore, setActiveStoreState] = useState<Store | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshStores = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/stores");
      const data = await res.json();
      setStores(data);
      const active = data.find((s: Store) => s.isActive);
      setActiveStoreState(active || null);
    } catch (error) {
      console.error("Error fetching stores:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setActiveStore = useCallback(
    async (store: Store) => {
      try {
        await fetch(`/api/stores/${store.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: true }),
        });
        await refreshStores();
      } catch (error) {
        console.error("Error setting active store:", error);
      }
    },
    [refreshStores]
  );

  useEffect(() => {
    refreshStores();
  }, [refreshStores]);

  return (
    <ActiveStoreContext.Provider
      value={{ activeStore, stores, setActiveStore, refreshStores, isLoading }}
    >
      {children}
    </ActiveStoreContext.Provider>
  );
}

export function useActiveStore() {
  const context = useContext(ActiveStoreContext);
  if (!context) {
    throw new Error("useActiveStore must be used within ActiveStoreProvider");
  }
  return context;
}
