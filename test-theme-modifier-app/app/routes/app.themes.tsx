import { useState, useCallback } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  Button,
  DataTable,
  Badge,
  Modal,
  TextField,
  Select,
  InlineStack,
  Box,
  Banner,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

// GraphQL Queries
const GET_THEMES = `#graphql
  query GetThemes {
    themes(first: 20) {
      nodes {
        id
        name
        role
        processing
      }
    }
  }
`;

const GET_THEME_FILES = `#graphql
  query GetThemeFiles($themeId: ID!) {
    theme(id: $themeId) {
      id
      name
      files(first: 250) {
        nodes {
          filename
          size
          contentType
          body {
            ... on OnlineStoreThemeFileBodyText {
              content
            }
            ... on OnlineStoreThemeFileBodyBase64 {
              contentBase64
            }
          }
        }
      }
    }
  }
`;

const UPSERT_THEME_FILES = `#graphql
  mutation ThemeFilesUpsert($themeId: ID!, $files: [OnlineStoreThemeFilesUpsertFileInput!]!) {
    themeFilesUpsert(themeId: $themeId, files: $files) {
      upsertedThemeFiles {
        filename
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const DELETE_THEME_FILES = `#graphql
  mutation ThemeFilesDelete($themeId: ID!, $files: [String!]!) {
    themeFilesDelete(themeId: $themeId, files: $files) {
      deletedThemeFiles {
        filename
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(GET_THEMES);
  const data = await response.json();

  return json({
    themes: data.data?.themes?.nodes || [],
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const actionType = formData.get("actionType") as string;

  try {
    switch (actionType) {
      case "getFiles": {
        const themeId = formData.get("themeId") as string;
        const response = await admin.graphql(GET_THEME_FILES, {
          variables: { themeId },
        });
        const data = await response.json();
        return json({
          success: true,
          action: "getFiles",
          theme: data.data?.theme,
        });
      }

      case "upsertFile": {
        const themeId = formData.get("themeId") as string;
        const filename = formData.get("filename") as string;
        const content = formData.get("content") as string;

        const response = await admin.graphql(UPSERT_THEME_FILES, {
          variables: {
            themeId,
            files: [
              {
                filename,
                body: { type: "TEXT", value: content },
              },
            ],
          },
        });
        const data = await response.json();

        if (data.data?.themeFilesUpsert?.userErrors?.length > 0) {
          return json({
            success: false,
            action: "upsertFile",
            errors: data.data.themeFilesUpsert.userErrors,
          });
        }

        return json({
          success: true,
          action: "upsertFile",
          upsertedFiles: data.data?.themeFilesUpsert?.upsertedThemeFiles,
        });
      }

      case "deleteFile": {
        const themeId = formData.get("themeId") as string;
        const filename = formData.get("filename") as string;

        const response = await admin.graphql(DELETE_THEME_FILES, {
          variables: {
            themeId,
            files: [filename],
          },
        });
        const data = await response.json();

        if (data.data?.themeFilesDelete?.userErrors?.length > 0) {
          return json({
            success: false,
            action: "deleteFile",
            errors: data.data.themeFilesDelete.userErrors,
          });
        }

        return json({
          success: true,
          action: "deleteFile",
          deletedFiles: data.data?.themeFilesDelete?.deletedThemeFiles,
        });
      }

      default:
        return json({ success: false, error: "Unknown action" });
    }
  } catch (error) {
    return json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export default function ThemesPage() {
  const { themes } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();

  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [themeFiles, setThemeFiles] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<any | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isNewFileOpen, setIsNewFileOpen] = useState(false);
  const [editorContent, setEditorContent] = useState("");
  const [newFilename, setNewFilename] = useState("");
  const [newFileContent, setNewFileContent] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState("all");

  const isLoading = fetcher.state !== "idle";

  // Handle fetcher data updates
  if (fetcher.data?.action === "getFiles" && fetcher.data?.success) {
    const files = fetcher.data.theme?.files?.nodes || [];
    if (JSON.stringify(files) !== JSON.stringify(themeFiles)) {
      setThemeFiles(files);
    }
  }

  const loadThemeFiles = useCallback(
    (themeId: string) => {
      setSelectedTheme(themeId);
      setThemeFiles([]);
      fetcher.submit(
        { actionType: "getFiles", themeId },
        { method: "POST" }
      );
    },
    [fetcher]
  );

  const openFileEditor = useCallback((file: any) => {
    setSelectedFile(file);
    setEditorContent(file.body?.content || "");
    setIsEditorOpen(true);
  }, []);

  const saveFile = useCallback(() => {
    if (!selectedTheme || !selectedFile) return;
    fetcher.submit(
      {
        actionType: "upsertFile",
        themeId: selectedTheme,
        filename: selectedFile.filename,
        content: editorContent,
      },
      { method: "POST" }
    );
    setIsEditorOpen(false);
  }, [fetcher, selectedTheme, selectedFile, editorContent]);

  const createNewFile = useCallback(() => {
    if (!selectedTheme || !newFilename) return;
    fetcher.submit(
      {
        actionType: "upsertFile",
        themeId: selectedTheme,
        filename: newFilename,
        content: newFileContent,
      },
      { method: "POST" }
    );
    setIsNewFileOpen(false);
    setNewFilename("");
    setNewFileContent("");
    // Reload files after creation
    setTimeout(() => loadThemeFiles(selectedTheme), 500);
  }, [fetcher, selectedTheme, newFilename, newFileContent, loadThemeFiles]);

  const deleteFile = useCallback(
    (filename: string) => {
      if (!selectedTheme) return;
      if (!confirm(`Are you sure you want to delete ${filename}?`)) return;
      fetcher.submit(
        {
          actionType: "deleteFile",
          themeId: selectedTheme,
          filename,
        },
        { method: "POST" }
      );
      // Reload files after deletion
      setTimeout(() => loadThemeFiles(selectedTheme), 500);
    },
    [fetcher, selectedTheme, loadThemeFiles]
  );

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "MAIN":
        return <Badge tone="success">Live</Badge>;
      case "UNPUBLISHED":
        return <Badge>Unpublished</Badge>;
      case "DEVELOPMENT":
        return <Badge tone="info">Development</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };

  const filteredFiles = themeFiles.filter((file) => {
    if (fileTypeFilter === "all") return true;
    if (fileTypeFilter === "liquid") return file.filename.endsWith(".liquid");
    if (fileTypeFilter === "json") return file.filename.endsWith(".json");
    if (fileTypeFilter === "css") return file.filename.endsWith(".css");
    if (fileTypeFilter === "js") return file.filename.endsWith(".js");
    if (fileTypeFilter === "assets") return file.filename.startsWith("assets/");
    return true;
  });

  const themeRows = themes.map((theme: any) => [
    theme.name,
    getRoleBadge(theme.role),
    theme.processing ? "Processing..." : "Ready",
    <Button
      key={theme.id}
      onClick={() => loadThemeFiles(theme.id)}
      size="slim"
      loading={isLoading && selectedTheme === theme.id}
    >
      View Files
    </Button>,
  ]);

  const fileRows = filteredFiles.map((file: any) => [
    file.filename,
    file.contentType || "unknown",
    file.size ? `${(file.size / 1024).toFixed(2)} KB` : "-",
    <InlineStack key={file.filename} gap="200">
      {file.body?.content !== undefined && (
        <Button size="slim" onClick={() => openFileEditor(file)}>
          Edit
        </Button>
      )}
      <Button size="slim" tone="critical" onClick={() => deleteFile(file.filename)}>
        Delete
      </Button>
    </InlineStack>,
  ]);

  return (
    <Page>
      <TitleBar title="Theme Manager" />
      <BlockStack gap="500">
        {fetcher.data?.success === false && fetcher.data?.errors && (
          <Banner tone="critical">
            <p>Error: {fetcher.data.errors.map((e: any) => e.message).join(", ")}</p>
          </Banner>
        )}

        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Store Themes
                </Text>
                <DataTable
                  columnContentTypes={["text", "text", "text", "text"]}
                  headings={["Theme Name", "Status", "State", "Actions"]}
                  rows={themeRows}
                />
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>

        {selectedTheme && (
          <Layout>
            <Layout.Section>
              <Card>
                <BlockStack gap="400">
                  <InlineStack align="space-between">
                    <Text as="h2" variant="headingMd">
                      Theme Files
                    </Text>
                    <InlineStack gap="300">
                      <Select
                        label=""
                        labelHidden
                        options={[
                          { label: "All Files", value: "all" },
                          { label: "Liquid", value: "liquid" },
                          { label: "JSON", value: "json" },
                          { label: "CSS", value: "css" },
                          { label: "JavaScript", value: "js" },
                          { label: "Assets", value: "assets" },
                        ]}
                        value={fileTypeFilter}
                        onChange={setFileTypeFilter}
                      />
                      <Button onClick={() => setIsNewFileOpen(true)}>
                        Create New File
                      </Button>
                      <Button onClick={() => loadThemeFiles(selectedTheme)}>
                        Refresh
                      </Button>
                    </InlineStack>
                  </InlineStack>

                  {isLoading ? (
                    <Text as="p">Loading files...</Text>
                  ) : (
                    <DataTable
                      columnContentTypes={["text", "text", "text", "text"]}
                      headings={["Filename", "Type", "Size", "Actions"]}
                      rows={fileRows}
                    />
                  )}
                </BlockStack>
              </Card>
            </Layout.Section>
          </Layout>
        )}
      </BlockStack>

      {/* File Editor Modal */}
      <Modal
        open={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        title={`Edit: ${selectedFile?.filename}`}
        primaryAction={{
          content: "Save",
          onAction: saveFile,
          loading: isLoading,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setIsEditorOpen(false),
          },
        ]}
        large
      >
        <Modal.Section>
          <TextField
            label="Content"
            value={editorContent}
            onChange={setEditorContent}
            multiline={20}
            autoComplete="off"
            monospaced
          />
        </Modal.Section>
      </Modal>

      {/* New File Modal */}
      <Modal
        open={isNewFileOpen}
        onClose={() => setIsNewFileOpen(false)}
        title="Create New Theme File"
        primaryAction={{
          content: "Create",
          onAction: createNewFile,
          loading: isLoading,
          disabled: !newFilename,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setIsNewFileOpen(false),
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <TextField
              label="Filename"
              value={newFilename}
              onChange={setNewFilename}
              autoComplete="off"
              placeholder="e.g., sections/my-section.liquid"
              helpText="Include the full path (e.g., templates/custom.json, snippets/my-snippet.liquid)"
            />
            <TextField
              label="Content"
              value={newFileContent}
              onChange={setNewFileContent}
              multiline={10}
              autoComplete="off"
              monospaced
            />
          </BlockStack>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
