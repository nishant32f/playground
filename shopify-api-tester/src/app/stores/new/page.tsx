"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useActiveStore } from "@/hooks/useActiveStore";

export default function NewStorePage() {
  const router = useRouter();
  const { refreshStores } = useActiveStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    storeUrl: "",
    adminApiToken: "",
    storefrontToken: "",
    scopes: "",
    apiVersion: "2025-01",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create store");
      }

      await refreshStores();
      router.push("/stores");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
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
          <div className="max-w-2xl">
            <div className="flex items-center gap-4 mb-6">
              <Link
                href="/stores"
                className="text-gray-500 hover:text-gray-700"
              >
                &larr; Back
              </Link>
              <h2 className="text-2xl font-semibold text-gray-900">
                Add Store Credentials
              </h2>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    placeholder="e.g., Dev Store - Theme App"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label
                    htmlFor="storeUrl"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Store URL *
                  </label>
                  <input
                    type="text"
                    id="storeUrl"
                    required
                    placeholder="my-store.myshopify.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.storeUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, storeUrl: e.target.value })
                    }
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Without https:// prefix
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="adminApiToken"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Admin API Token *
                  </label>
                  <input
                    type="password"
                    id="adminApiToken"
                    required
                    placeholder="shpat_xxxxxxxxxxxxxxxx"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                    value={formData.adminApiToken}
                    onChange={(e) =>
                      setFormData({ ...formData, adminApiToken: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label
                    htmlFor="storefrontToken"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Storefront API Token
                  </label>
                  <input
                    type="password"
                    id="storefrontToken"
                    placeholder="Optional"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                    value={formData.storefrontToken}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        storefrontToken: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label
                    htmlFor="scopes"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Scopes *
                  </label>
                  <input
                    type="text"
                    id="scopes"
                    required
                    placeholder="read_themes,write_themes,read_products"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                    value={formData.scopes}
                    onChange={(e) =>
                      setFormData({ ...formData, scopes: e.target.value })
                    }
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Comma-separated list of scopes
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="apiVersion"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    API Version
                  </label>
                  <select
                    id="apiVersion"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.apiVersion}
                    onChange={(e) =>
                      setFormData({ ...formData, apiVersion: e.target.value })
                    }
                  >
                    <option value="2025-01">2025-01 (Latest)</option>
                    <option value="2024-10">2024-10</option>
                    <option value="2024-07">2024-07</option>
                    <option value="2024-04">2024-04</option>
                    <option value="2024-01">2024-01</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="notes"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    rows={3}
                    placeholder="Optional notes about this credential"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Store"}
                </button>
                <Link
                  href="/stores"
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
