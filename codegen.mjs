import { loadEnvConfig } from "@next/env";
import path from "path";

const projectDir = path.join(process.cwd());
loadEnvConfig(projectDir);

const magentoEndpoint =
  process.env.NEXT_PUBLIC_MAGENTO_ENDPOINT ?? "https://b2b.benuta.com/graphql";
const magentoStore = process.env.MAGENTO_STORE_CODE ?? "benuta_eu";

const contentfulSpace = process.env.CONTENTFUL_SPACE_ID;
const contentfulEnv = process.env.CONTENTFUL_ENV ?? "master";
const contentfulToken = process.env.CONTENTFUL_CDA_TOKEN;
const contentfulEndpoint = contentfulSpace
  ? `https://graphql.contentful.com/content/v1/spaces/${contentfulSpace}/environments/${contentfulEnv}`
  : undefined;

if (!contentfulSpace) {
  console.warn(
    "CONTENTFUL_SPACE_ID is not set; Contentful codegen will fail until provided.",
  );
}

if (!contentfulToken) {
  console.warn(
    "CONTENTFUL_CDA_TOKEN is not set; Contentful codegen will fail until provided.",
  );
}

const config = {
  overwrite: true,
  ignoreNoDocuments: true,
  generates: {
    "src/generated/magento.ts": {
      schema: [
        {
          [magentoEndpoint]: {
            headers: {
              Store: magentoStore,
            },
          },
        },
      ],
      documents: "src/graphql/magento/**/*.{gql,graphql}",
      plugins: [
        "typescript",
        "typescript-operations",
        "typescript-react-query",
      ],
      config: {
        fetcher: { func: "./src/lib/codegen-fetcher#magentoFetcher" },
        exposeQueryKeys: true,
      },
    },
    "src/generated/contentful.ts": {
      schema: [
        {
          [contentfulEndpoint ??
          "https://graphql.contentful.com/content/v1/spaces/SPACE_ID/environments/master"]:
            {
              headers: {
                Authorization: `Bearer ${
                  contentfulToken ?? "CONTENTFUL_CDA_TOKEN"
                }`,
              },
            },
        },
      ],
      documents: "src/graphql/contentful/**/*.{gql,graphql}",
      plugins: [
        "typescript",
        "typescript-operations",
        "typescript-react-query",
      ],
      config: {
        fetcher: { func: "./src/lib/codegen-fetcher#contentfulFetcher" },
        exposeQueryKeys: true,
      },
    },
  },
};

export default config;
