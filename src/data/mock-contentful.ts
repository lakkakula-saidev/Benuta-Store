export type MockHeroBanner = {
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  tagline?: string;
  theme?: "light" | "dark";
  alignment?: "left" | "center" | "right";
  backgroundOverlay?: boolean;
  image?: { url: string; description?: string };
  imageAlt?: string;
};

export const MOCK_HERO_BANNERS: MockHeroBanner[] = [
  {
    title: "Shopper Store",
    subtitle: "Premium Teppiche & Wohnaccessoires",
    ctaLabel: "Jetzt entdecken",
    ctaUrl: "/teppiche",
    tagline: "Neue Kollektion 2024",
    theme: "light",
    alignment: "left",
    backgroundOverlay: true,
    image: {
      url: "/sample-image.jpg",
      description: "Wohnzimmer mit weichem Teppich"
    },
    imageAlt: "Gemütliches Wohnzimmer mit Teppich"
  },
  {
    title: "Sommerliche Outdoor Looks",
    subtitle: "Wetterfeste Teppiche für Balkon & Terrasse",
    ctaLabel: "Outdoor entdecken",
    ctaUrl: "/wohnaccessoires",
    tagline: "Balkon ready",
    theme: "dark",
    alignment: "center",
    backgroundOverlay: true,
    image: {
      url: "/sample-image.jpg",
      description: "Outdoor Teppich auf Terrasse"
    },
    imageAlt: "Terrasse mit Outdoor Teppich"
  }
];
