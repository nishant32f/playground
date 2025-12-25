"use client";

import Link from "next/link";
import { useState, useCallback } from "react";
import { useActiveStore } from "@/hooks/useActiveStore";

interface Theme {
  id: string;
  name: string;
  role: string;
  processing: boolean;
}

interface ThemeFile {
  filename: string;
  size: number;
  contentType: string;
}

export default function ThemesPage() {
  const { activeStore, stores, setActiveStore, isLoading } = useActiveStore();

  // State for different operations
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string>("");
  const [themeFiles, setThemeFiles] = useState<ThemeFile[]>([]);
  const [fileFilter, setFileFilter] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [fileContent, setFileContent] = useState<string>("");
  const [newFilename, setNewFilename] = useState<string>("");
  const [newFileContent, setNewFileContent] = useState<string>("");

  // Loading and result states
  const [loadingOp, setLoadingOp] = useState<string | null>(null);
  const [result, setResult] = useState<{
    type: "success" | "error";
    message: string;
    data?: unknown;
  } | null>(null);
  const [show401Help, setShow401Help] = useState(false);

  const headers = useCallback((): Record<string, string> => {
    if (!activeStore) return {};
    return { "X-Store-Id": activeStore.id };
  }, [activeStore]);

  const handleApiError = (err: unknown) => {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    // Check if it's a 401 error (invalid/expired token)
    if (errorMessage.includes("401") || errorMessage.includes("Invalid API key")) {
      setShow401Help(true);
    }
    return errorMessage;
  };

  // Sync token from Remix app
  const syncToken = async () => {
    setLoadingOp("sync");
    setResult(null);
    try {
      const res = await fetch("/api/sync-token", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync failed");
      setResult({
        type: "success",
        message: data.message || "Token synced successfully!",
        data,
      });
      setShow401Help(false); // Clear 401 help if successful
    } catch (err) {
      setResult({
        type: "error",
        message: err instanceof Error ? err.message : "Token sync failed",
      });
    } finally {
      setLoadingOp(null);
    }
  };

  // Test connection
  const testConnection = async () => {
    if (!activeStore) return;
    setLoadingOp("connection");
    setResult(null);
    try {
      const res = await fetch("/api/shopify/shop", { headers: headers() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult({
        type: "success",
        message: "Connection successful!",
        data,
      });
      setShow401Help(false); // Clear 401 help if successful
    } catch (err) {
      setResult({
        type: "error",
        message: handleApiError(err),
      });
    } finally {
      setLoadingOp(null);
    }
  };

  // List themes
  const listThemes = async () => {
    if (!activeStore) return;
    setLoadingOp("themes");
    setResult(null);
    try {
      const res = await fetch("/api/shopify/themes", { headers: headers() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setThemes(data.themes?.nodes || []);
      setResult({
        type: "success",
        message: `Found ${data.themes?.nodes?.length || 0} themes`,
        data,
      });
    } catch (err) {
      setResult({
        type: "error",
        message: handleApiError(err),
      });
    } finally {
      setLoadingOp(null);
    }
  };

  // Get theme files
  const getThemeFiles = async () => {
    if (!activeStore || !selectedTheme) return;
    setLoadingOp("files");
    setResult(null);
    try {
      const res = await fetch(
        `/api/shopify/themes/${encodeURIComponent(selectedTheme)}`,
        { headers: headers() }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setThemeFiles(data.theme?.files?.nodes || []);
      setResult({
        type: "success",
        message: `Found ${data.theme?.files?.nodes?.length || 0} files`,
        data,
      });
    } catch (err) {
      setResult({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to get files",
      });
    } finally {
      setLoadingOp(null);
    }
  };

  // Get file content
  const getFileContent = async (filename?: string) => {
    const fileToLoad = filename || selectedFile;
    if (!activeStore || !selectedTheme || !fileToLoad) return;
    setLoadingOp("content");
    setResult(null);
    try {
      const res = await fetch(
        `/api/shopify/themes/${encodeURIComponent(
          selectedTheme
        )}/files?filename=${encodeURIComponent(fileToLoad)}`,
        { headers: headers() }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const file = data.theme?.files?.nodes?.[0];
      const content =
        file?.body?.content || file?.body?.contentBase64 || "No content";
      setFileContent(content);
      setNewFileContent(content);
    } catch (err) {
      setResult({
        type: "error",
        message: handleApiError(err),
      });
    } finally {
      setLoadingOp(null);
    }
  };

  // Create/update file
  const upsertFile = async () => {
    if (!activeStore || !selectedTheme || !newFilename || !newFileContent)
      return;
    setLoadingOp("upsert");
    setResult(null);
    try {
      const res = await fetch(
        `/api/shopify/themes/${encodeURIComponent(selectedTheme)}/files`,
        {
          method: "POST",
          headers: { ...headers(), "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: newFilename,
            content: newFileContent,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult({
        type: "success",
        message: `File ${newFilename} saved successfully`,
        data,
      });
      // Refresh file list to show any new files
      await getThemeFiles();
    } catch (err) {
      setResult({
        type: "error",
        message: handleApiError(err),
      });
    } finally {
      setLoadingOp(null);
    }
  };

  // Delete file
  const deleteFile = async () => {
    if (!activeStore || !selectedTheme || !selectedFile) return;
    if (!confirm(`Delete file "${selectedFile}"?`)) return;
    setLoadingOp("delete");
    setResult(null);
    try {
      const res = await fetch(
        `/api/shopify/themes/${encodeURIComponent(
          selectedTheme
        )}/files?filename=${encodeURIComponent(selectedFile)}`,
        { method: "DELETE", headers: headers() }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult({
        type: "success",
        message: `File ${selectedFile} deleted`,
        data,
      });
      setSelectedFile("");
      setFileContent("");
      setNewFileContent("");
      // Refresh file list
      await getThemeFiles();
    } catch (err) {
      setResult({
        type: "error",
        message: handleApiError(err),
      });
    } finally {
      setLoadingOp(null);
    }
  };

  const filteredFiles = themeFiles.filter(
    (f) => !fileFilter || f.filename.toLowerCase().includes(fileFilter.toLowerCase())
  );

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
              {isLoading ? "Loading..." : stores.length === 0 ? "No stores" : "Select a store"}
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
              <Link href="/" className="block px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-50">
                Dashboard
              </Link>
            </li>
            <li>
              <Link href="/stores" className="block px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-50">
                Store Credentials
              </Link>
            </li>
            <li>
              <Link href="/themes" className="block px-4 py-2 rounded-lg bg-gray-100 text-gray-900 font-medium">
                Theme Operations
              </Link>
            </li>
          </ul>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-4xl space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              Theme Operations
            </h2>

            {!activeStore && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
                Please select a store from the dropdown above to use theme operations.
              </div>
            )}

            {/* 401 Help Banner */}
            {show401Help && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-blue-900 mb-2">
                      Access Token Expired or Invalid
                    </h3>
                    <p className="text-sm text-blue-800 mb-3">
                      Your Shopify access token needs to be refreshed. Follow these steps:
                    </p>
                    <ol className="text-sm text-blue-800 space-y-2 ml-4 list-decimal">
                      <li>Make sure your Remix app is running (<code className="bg-blue-100 px-1 rounded">npm run dev</code> in test-theme-modifier-app)</li>
                      <li>Visit the Remix app URL with your shop parameter: <br/>
                        <code className="bg-blue-100 px-2 py-1 rounded text-xs inline-block mt-1">
                          https://your-tunnel-url.trycloudflare.com?shop={activeStore?.storeUrl || 'your-store.myshopify.com'}
                        </code>
                      </li>
                      <li>Complete the OAuth flow to re-authenticate</li>
                      <li>The token will automatically sync, or click "Sync Token" below</li>
                    </ol>
                  </div>
                  <button
                    onClick={() => setShow401Help(false)}
                    className="text-blue-500 hover:text-blue-700 ml-4"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Sync Token */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Sync Token</h3>
                  <p className="text-sm text-gray-500">
                    Import tokens from test-theme-modifier-app database
                  </p>
                </div>
                <button
                  onClick={syncToken}
                  disabled={loadingOp === "sync"}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {loadingOp === "sync" ? "Syncing..." : "Sync Token"}
                </button>
              </div>
            </div>

            {/* Test Connection */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Test Connection</h3>
                  <p className="text-sm text-gray-500">
                    Verify API credentials work
                  </p>
                </div>
                <button
                  onClick={testConnection}
                  disabled={!activeStore || loadingOp === "connection"}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loadingOp === "connection" ? "Testing..." : "Test"}
                </button>
              </div>
            </div>

            {/* List Themes */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-medium text-gray-900">List Themes</h3>
                  <p className="text-sm text-gray-500">
                    Get all themes in the store
                  </p>
                </div>
                <button
                  onClick={listThemes}
                  disabled={!activeStore || loadingOp === "themes"}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loadingOp === "themes" ? "Loading..." : "List Themes"}
                </button>
              </div>
              {themes.length > 0 && (
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select a theme:
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    value={selectedTheme}
                    onChange={(e) => {
                      setSelectedTheme(e.target.value);
                      setThemeFiles([]);
                      setSelectedFile("");
                      setFileContent("");
                    }}
                  >
                    <option value="">Choose a theme</option>
                    {themes.map((theme) => (
                      <option key={theme.id} value={theme.id}>
                        {theme.name} ({theme.role})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* File Browser */}
            {selectedTheme && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-medium text-gray-900">File Browser</h3>
                    <p className="text-sm text-gray-500">
                      Browse and edit theme files
                    </p>
                  </div>
                  <button
                    onClick={getThemeFiles}
                    disabled={loadingOp === "files"}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loadingOp === "files" ? "Loading..." : "Load Files"}
                  </button>
                </div>

                {themeFiles.length > 0 && (
                  <div className="flex gap-4 border-t pt-4">
                    {/* Left Panel - File List */}
                    <div className="w-1/3 border-r pr-4">
                      <div className="flex gap-2 mb-3">
                        <input
                          type="text"
                          placeholder="Filter files..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          value={fileFilter}
                          onChange={(e) => setFileFilter(e.target.value)}
                        />
                        <button
                          onClick={() => {
                            setSelectedFile("");
                            setNewFilename("");
                            setFileContent("");
                            setNewFileContent("");
                          }}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                          title="Create new file"
                        >
                          + New
                        </button>
                      </div>
                      <div className="border rounded-lg overflow-hidden">
                        <div className="max-h-[600px] overflow-y-auto">
                          {filteredFiles.map((file) => (
                            <button
                              key={file.filename}
                              onClick={() => {
                                setSelectedFile(file.filename);
                                setNewFilename(file.filename);
                                getFileContent(file.filename);
                              }}
                              className={`w-full text-left px-3 py-2 text-xs font-mono hover:bg-gray-50 border-b last:border-b-0 ${
                                selectedFile === file.filename
                                  ? "bg-blue-50 text-blue-900"
                                  : "text-gray-700"
                              }`}
                            >
                              {file.filename}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="mt-3 text-xs text-gray-500">
                        {filteredFiles.length} file{filteredFiles.length !== 1 ? "s" : ""}
                      </div>
                    </div>

                    {/* Right Panel - File Content/Editor */}
                    <div className="flex-1">
                      {selectedFile || newFilename ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              {selectedFile ? (
                                <>
                                  <h4 className="font-medium text-gray-900 font-mono text-sm">
                                    {selectedFile}
                                  </h4>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Edit and save file
                                  </p>
                                </>
                              ) : (
                                <>
                                  <input
                                    type="text"
                                    placeholder="Enter filename (e.g., snippets/test.liquid)"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                                    value={newFilename}
                                    onChange={(e) => setNewFilename(e.target.value)}
                                  />
                                  <p className="text-xs text-gray-500 mt-1">
                                    Create new file
                                  </p>
                                </>
                              )}
                            </div>
                            {selectedFile && (
                              <div className="flex gap-2 ml-4">
                                <button
                                  onClick={getFileContent}
                                  disabled={loadingOp === "content"}
                                  className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
                                >
                                  {loadingOp === "content" ? "Loading..." : "Refresh"}
                                </button>
                                <button
                                  onClick={deleteFile}
                                  disabled={loadingOp === "delete"}
                                  className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                                >
                                  {loadingOp === "delete" ? "Deleting..." : "Delete"}
                                </button>
                              </div>
                            )}
                          </div>

                          <textarea
                            placeholder="File content will appear here..."
                            rows={20}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-xs bg-gray-900 text-gray-100"
                            value={fileContent || newFileContent}
                            onChange={(e) => {
                              setFileContent(e.target.value);
                              setNewFileContent(e.target.value);
                            }}
                          />

                          <div className="flex gap-2">
                            <button
                              onClick={upsertFile}
                              disabled={!newFilename || !newFileContent || loadingOp === "upsert"}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                              {loadingOp === "upsert" ? "Saving..." : "Save File"}
                            </button>
                            <button
                              onClick={() => {
                                setSelectedFile("");
                                setNewFilename("");
                                setFileContent("");
                                setNewFileContent("");
                              }}
                              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-64 text-gray-500 text-sm border-2 border-dashed rounded-lg">
                          Select a file from the list to view and edit, or click "+ New" to create a file
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {themeFiles.length === 0 && (
                  <div className="text-center py-8 text-gray-500 text-sm border-t">
                    Click "Load Files" to browse theme files
                  </div>
                )}
              </div>
            )}

            {/* Results */}
            {result && (
              <div
                className={`rounded-lg border p-4 ${
                  result.type === "success"
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <h3
                  className={`font-medium mb-2 ${
                    result.type === "success" ? "text-green-800" : "text-red-800"
                  }`}
                >
                  {result.type === "success" ? "Success" : "Error"}
                </h3>
                <p
                  className={
                    result.type === "success" ? "text-green-700" : "text-red-700"
                  }
                >
                  {result.message}
                </p>
                {result.data !== undefined && (
                  <pre className="mt-4 bg-white p-4 rounded border text-xs overflow-x-auto max-h-48 overflow-y-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
