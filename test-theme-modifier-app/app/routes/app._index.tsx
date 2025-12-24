import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  BlockStack,
  List,
  Link,
  Box,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  // Fetch themes to show a quick overview
  const response = await admin.graphql(`#graphql
    query GetThemes {
      themes(first: 5) {
        nodes {
          id
          name
          role
        }
      }
    }
  `);

  const data = await response.json();
  const themes = data.data?.themes?.nodes || [];

  return json({ themes });
};

export default function Index() {
  const { themes } = useLoaderData<typeof loader>();

  const liveTheme = themes.find((t: any) => t.role === "MAIN");

  return (
    <Page>
      <TitleBar title="Theme Modifier App" />
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Welcome to Theme Modifier
                </Text>
                <Text as="p" variant="bodyMd">
                  This app allows you to manage your store themes and embed
                  dynamic content blocks powered by our SDK.
                </Text>

                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm">
                    Quick Actions
                  </Text>
                  <List>
                    <List.Item>
                      <Link url="/app/themes" removeUnderline>
                        Manage Themes
                      </Link>{" "}
                      - View, edit, and manage theme files
                    </List.Item>
                    <List.Item>
                      Add <strong>App Blocks</strong> to your theme via the
                      Theme Editor
                    </List.Item>
                  </List>
                </BlockStack>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section variant="oneThird">
            <BlockStack gap="500">
              <Card>
                <BlockStack gap="300">
                  <Text as="h2" variant="headingMd">
                    Current Theme
                  </Text>
                  {liveTheme ? (
                    <Box
                      padding="300"
                      background="bg-surface-success"
                      borderRadius="200"
                    >
                      <Text as="p" variant="bodyMd" fontWeight="semibold">
                        {liveTheme.name}
                      </Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Live theme
                      </Text>
                    </Box>
                  ) : (
                    <Text as="p" variant="bodyMd" tone="subdued">
                      No live theme found
                    </Text>
                  )}
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="300">
                  <Text as="h2" variant="headingMd">
                    App Blocks Available
                  </Text>
                  <List>
                    <List.Item>
                      <strong>SDK Content</strong> - Dynamic content from your
                      app
                    </List.Item>
                    <List.Item>
                      <strong>Layout Switcher</strong> - Grid/List/Carousel
                      layouts
                    </List.Item>
                    <List.Item>
                      <strong>Star Rating</strong> - Product ratings display
                    </List.Item>
                  </List>
                  <Text as="p" variant="bodySm" tone="subdued">
                    Add these blocks via Online Store &gt; Themes &gt; Customize
                  </Text>
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
