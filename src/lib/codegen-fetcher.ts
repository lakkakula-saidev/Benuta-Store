import { graphqlFetch } from "./graphql-client";

const magentoEndpoint = process.env.NEXT_PUBLIC_MAGENTO_ENDPOINT;
const magentoStoreCode = process.env.MAGENTO_STORE_CODE;

const contentfulSpace = process.env.CONTENTFUL_SPACE_ID;
const contentfulEnv = process.env.CONTENTFUL_ENV ?? "master";
const contentfulToken = process.env.CONTENTFUL_CDA_TOKEN;

const contentfulEndpoint = contentfulSpace
  ? `https://graphql.contentful.com/content/v1/spaces/${contentfulSpace}/environments/${contentfulEnv}`
  : undefined;

export function magentoFetcher<TData, TVariables = Record<string, unknown>>(
  query: string,
  variables?: TVariables,
) {
  if (!magentoEndpoint) {
    throw new Error("NEXT_PUBLIC_MAGENTO_ENDPOINT is not set");
  }

  return graphqlFetch<TData>({
    endpoint: magentoEndpoint,
    query,
    variables: variables as Record<string, unknown>,
    headers: {
      Store: magentoStoreCode ?? "benuta_eu",
    },
  });
}

export function contentfulFetcher<TData, TVariables = Record<string, unknown>>(
  query: string,
  variables?: TVariables,
) {
  if (!contentfulEndpoint || !contentfulToken) {
    throw new Error(
      "CONTENTFUL_SPACE_ID and CONTENTFUL_CDA_TOKEN must be set for Contentful requests",
    );
  }

  return graphqlFetch<TData>({
    endpoint: contentfulEndpoint,
    query,
    variables: variables as Record<string, unknown>,
    headers: {
      Authorization: `Bearer ${contentfulToken}`,
    },
  });
}
