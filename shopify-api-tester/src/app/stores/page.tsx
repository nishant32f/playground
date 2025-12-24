"use client";

import Link from "next/link";
import { useActiveStore } from "@/hooks/useActiveStore";
import { useState } from "react";

export default function StoresPage() {
  const { stores, activeStore, setActiveStore, refreshStores, isLoading } =
    useActiveStore();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this store credential?")) {
      return;
    }
    setDeletingId(id);
    try {
      await fetch(`/api/stores/${id}`, { method: "DELETE" });
      await refreshStores();
    } catch (error) {
      console.error("Error deleting store:", error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">
            Shopify API Tester
          </h1>
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            value={activeStore?.id || ""}
            onChange={(e) => {
              const store = stores.find((s) => s.id === e.target.value);
              if (store) setActiveStore(store);
            }}
            disabled={isLoading || stores.length === 0}
          >
            <option value="">
              {isLoading
                ? "Loading..."
                : stores.length === 0
                ? "No stores"
                : "Select a store"}
            </option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name} ({store.storeUrl})
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-65px)] p-4">
          <ul className="space-y-2">
            <li>
              <Link
                href="/"
                className="block px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                Dashboard
              </Link>
            </li>
            <li>
              <Link
                href="/stores"
                className="block px-4 py-2 rounded-lg bg-gray-100 text-gray-900 font-medium"
              >
                Store Credentials
              </Link>
            </li>
            <li>
              <Link
                href="/themes"
                className="block px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                Theme Operations
              </Link>
            </li>
          </ul>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-4xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">
                Store Credentials
              </h2>
              <Link
                href="/stores/new"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Store
              </Link>
            </div>

            {isLoading ? (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
                Loading...
              </div>
            ) : stores.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <p className="text-gray-500 mb-4">
                  No store credentials configured yet.
                </p>
                <Link
                  href="/stores/new"
                  className="text-blue-600 hover:underline"
                >
                  Add your first store
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {stores.map((store) => (
                  <div
                    key={store.id}
                    className={`bg-white rounded-lg border p-6 ${
                      store.isActive
                        ? "border-blue-300 ring-1 ring-blue-200"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-gray-900">
                            {store.name}
                          </h3>
                          {store.isActive && (
                            <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                          <div>
                            <span className="text-gray-500">Store URL:</span>{" "}
                            <span className="text-gray-900">
                              {store.storeUrl}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">API Version:</span>{" "}
                            <span className="text-gray-900">
                              {store.apiVersion}
                            </span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-500">Scopes:</span>{" "}
                            <span className="text-gray-900 font-mono text-xs">
                              {store.scopes}
                            </span>
                          </div>
                          {store.notes && (
                            <div className="col-span-2">
                              <span className="text-gray-500">Notes:</span>{" "}
                              <span className="text-gray-900">
                                {store.notes}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {!store.isActive && (
                          <button
                            onClick={() => setActiveStore(store)}
                            className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded"
                          >
                            Set Active
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(store.id)}
                          disabled={deletingId === store.id}
                          className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                        >
                          {deletingId === store.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
