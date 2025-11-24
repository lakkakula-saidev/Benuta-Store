import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "media.benuta.com" },
      { protocol: "https", hostname: "cdn.benuta.com" },
      { protocol: "https", hostname: "b2b.benuta.com" },
      { protocol: "https", hostname: "d2p9cgvzxmwopv.cloudfront.net" },
      { protocol: "https", hostname: "www.benuta.eu" },
    ],
  },
};

export default nextConfig;
