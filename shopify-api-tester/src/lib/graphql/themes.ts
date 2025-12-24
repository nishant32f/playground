export const GET_SHOP = `
  query GetShop {
    shop {
      name
      email
      primaryDomain {
        url
        host
      }
      plan {
        displayName
      }
    }
  }
`;

export const LIST_THEMES = `
  query ListThemes {
    themes(first: 20) {
      nodes {
        id
        name
        role
        processing
        createdAt
        updatedAt
      }
    }
  }
`;

export const GET_THEME_FILES = `
  query GetThemeFiles($themeId: ID!) {
    theme(id: $themeId) {
      id
      name
      role
      files(first: 250) {
        nodes {
          filename
          size
          contentType
          checksumMd5
          createdAt
          updatedAt
        }
      }
    }
  }
`;

export const GET_FILE_CONTENT = `
  query GetFileContent($themeId: ID!, $filenames: [String!]!) {
    theme(id: $themeId) {
      id
      name
      files(filenames: $filenames, first: 1) {
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

export const UPSERT_THEME_FILE = `
  mutation ThemeFilesUpsert($themeId: ID!, $files: [OnlineStoreThemeFilesUpsertFileInput!]!) {
    themeFilesUpsert(themeId: $themeId, files: $files) {
      upsertedThemeFiles {
        filename
        checksumMd5
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const DELETE_THEME_FILE = `
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
