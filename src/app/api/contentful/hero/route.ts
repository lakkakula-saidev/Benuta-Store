import { NextResponse } from "next/server";

const HERO_QUERY = `
  query HeroBanner {
    heroBannerCollection(order: sys_firstPublishedAt_ASC) {
      items {
        title
        subtitle
        ctaLabel
        ctaUrl
        tagline
        theme
        alignment
        backgroundOverlay
        image {
          url
          description
        }
        imageAlt
      }
    }
  }
`;

export async function GET() {
  const spaceId = process.env.CONTENTFUL_SPACE_ID;
  const envId = process.env.CONTENTFUL_ENV ?? "master";
  const token = process.env.CONTENTFUL_CDA_TOKEN;

  if (!spaceId || !token) {
    return NextResponse.json(
      { error: "Contentful credentials are missing" },
      { status: 500 }
    );
  }

  const endpoint = `https://graphql.contentful.com/content/v1/spaces/${spaceId}/environments/${envId}`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ query: HERO_QUERY })
    });

    const payload = await response.json();

    if (!response.ok || payload.errors) {
      console.error("Contentful hero query failed", payload.errors ?? payload);
      return NextResponse.json(
        { error: "Failed to load Contentful hero" },
        { status: 500 }
      );
    }

    const heroes = payload.data?.heroBannerCollection?.items ?? [];

    return NextResponse.json({ heroes });
  } catch (error) {
    console.error("Contentful hero fetch error", error);
    return NextResponse.json(
      { error: "Failed to load Contentful hero" },
      { status: 500 }
    );
  }
}
