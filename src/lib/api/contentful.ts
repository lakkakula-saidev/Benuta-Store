import { useQuery } from "@tanstack/react-query";

export type HeroContent = {
  title: string | null;
  subtitle?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  tagline?: string | null;
  theme?: "light" | "dark" | null;
  alignment?: "left" | "center" | "right" | null;
  backgroundOverlay?: boolean | null;
  image?: { url?: string | null; description?: string | null } | null;
  imageAlt?: string | null;
};

/**
 * Hook to fetch hero content from Contentful.
 */
export function useHeroContent() {
  return useQuery<{ heroes: HeroContent[] }>({
    queryKey: ["hero-banner"],
    queryFn: async () => {
      const res = await fetch("/api/contentful/hero");
      if (!res.ok) {
        throw new Error("Failed to load hero banner");
      }
      return res.json();
    },
    staleTime: 10 * 60 * 1000
  });
}
