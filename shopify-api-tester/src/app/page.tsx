"use client";

import Link from "next/link";
import { useActiveStore } from "@/hooks/useActiveStore";

export default function Home() {
  const { activeStore, stores, setActiveStore, isLoading } = useActiveStore();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">
            Shopify API Tester
          </h1>
          <div className="flex items-center gap-4">
            {/* Store Selector */}
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
                  ? "No stores configured"
                  : "Select a store"}
              </option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name} ({store.storeUrl})
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-65px)] p-4">
          <ul className="space-y-2">
            <li>
              <Link
                href="/"
                className="block px-4 py-2 rounded-lg bg-gray-100 text-gray-900 font-medium"
              >
                Dashboard
              </Link>
            </li>
            <li>
              <Link
                href="/stores"
                className="block px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-50"
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
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Dashboard
            </h2>

            {/* Active Store Info */}
            {activeStore ? (
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <h3 className="font-medium text-gray-900 mb-4">Active Store</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Name:</span>{" "}
                    <span className="text-gray-900">{activeStore.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">URL:</span>{" "}
                    <span className="text-gray-900">{activeStore.storeUrl}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">API Version:</span>{" "}
                    <span className="text-gray-900">{activeStore.apiVersion}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Scopes:</span>{" "}
                    <span className="text-gray-900 font-mono text-xs">
                      {activeStore.scopes}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                <p className="text-yellow-800">
                  No store selected. Please{" "}
                  <Link href="/stores" className="underline font-medium">
                    add store credentials
                  </Link>{" "}
                  or select an existing store from the dropdown above.
                </p>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
              <Link
                href="/stores"
                className="bg-white rounded-lg border border-gray-200 p-6 hover:border-gray-300 transition-colors"
              >
                <h3 className="font-medium text-gray-900 mb-2">
                  Manage Stores
                </h3>
                <p className="text-sm text-gray-500">
                  Add, edit, or remove store credentials
                </p>
              </Link>
              <Link
                href="/themes"
                className="bg-white rounded-lg border border-gray-200 p-6 hover:border-gray-300 transition-colors"
              >
                <h3 className="font-medium text-gray-900 mb-2">
                  Theme Operations
                </h3>
                <p className="text-sm text-gray-500">
                  List themes, view and edit files
                </p>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
