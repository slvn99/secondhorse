import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Seed images use Unsplash
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      // AI-generated images served via DeepAI
      { protocol: "https", hostname: "api.deepai.org" },
      // Uploaded images use Vercel Blob
      { protocol: "https", hostname: "*.vercel-storage.com" },
      { protocol: "https", hostname: "blob.vercel-storage.com" },
    ],
  },
  async redirects() {
    return [
      {
        source: "/extra/ai-generated/codex/tinder-for-horses/new",
        destination: "/new",
        permanent: true,
      },
      {
        source: "/extra/ai-generated/codex/tinder-for-horses/new/",
        destination: "/new",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    // Keep TFH assets accessible regardless of path or case (ported from v2)
    return [
      { source: "/:path*/tinder-for-horses-cover-image.png", destination: "/Tinder-for-Horses-cover-image.png" },
      { source: "/:path*/tinder-for-horses-background.png", destination: "/Tinder-for-Horses-background.png" },
      { source: "/TFH/Tinder-for-Horses-cover-image.png", destination: "/Tinder-for-Horses-cover-image.png" },
      { source: "/TFH/Tinder-for-Horses-background.png", destination: "/Tinder-for-Horses-background.png" },
      { source: "/TFH/tinder-for-horses%20introsong.mp3", destination: "/tinder-for-horses%20introsong.mp3" },
      { source: "/TFH/tinder-for-horses introsong.mp3", destination: "/tinder-for-horses introsong.mp3" },
      { source: "/TFH/horse_holding_a_fish.png", destination: "/horse_holding_a_fish.png" },
      { source: "/TFH/horse_in_a_gym.png", destination: "/horse_in_a_gym.png" },
      { source: "/TFH/horse_on_a_hike.png", destination: "/horse_on_a_hike.png" },
      { source: "/TFH/horse_on_beach_holiday_south_europe.png", destination: "/horse_on_beach_holiday_south_europe.png" },
      { source: "/TFH/horse_partying.png", destination: "/horse_partying.png" },
    ];
  },
  async headers() {
    const isProd = process.env.NODE_ENV === "production";
    const scriptSrc = [
      "script-src 'self'",
      "'unsafe-inline'",
      ...(isProd ? [] : ["'unsafe-eval'"]),
      "https://vitals.vercel-insights.com",
      "https://va.vercel-scripts.com",
      "https://hcaptcha.com",
      "https://*.hcaptcha.com",
    ].join(" ");

    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "form-action 'self' https://hcaptcha.com https://*.hcaptcha.com",
              "frame-ancestors 'none'",
              scriptSrc,
              "style-src 'self' 'unsafe-inline'",
              [
                "img-src 'self' data: blob:",
                "https://images.unsplash.com",
                "https://plus.unsplash.com",
                "https://api.deepai.org",
                "https://*.vercel-storage.com",
                "https://blob.vercel-storage.com",
              ].join(" "),
              "connect-src 'self' https: wss:",
              "font-src 'self' data:",
              "object-src 'none'",
              "frame-src 'self' https://hcaptcha.com https://*.hcaptcha.com",
            ].join("; "),
          },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=(), payment=(), usb=()" },
        ],
      },
      {
        source: "/:all*(png|jpg|jpeg|gif|webp|svg|mp3)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=604800, s-maxage=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
