import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "source.unsplash.com" },
      { protocol: "https", hostname: "api.deepai.org" },
      { protocol: "https", hostname: "randomuser.me" },
      { protocol: "https", hostname: "cataas.com" },
      { protocol: "https", hostname: "media1.tenor.com" },
      { protocol: "https", hostname: "i.scdn.co" },
      { protocol: "https", hostname: "secure.notion-static.com" },
      { protocol: "https", hostname: "www.notion.so" },
      { protocol: "https", hostname: "prod-files-secure.notion-static.com" },
      { protocol: "https", hostname: "notion.so" },
      { protocol: "https", hostname: "static.notion-static.com" },
      { protocol: "https", hostname: "images.notion.so" },
      { protocol: "https", hostname: "img.notionusercontent.com" },
      { protocol: "https", hostname: "prod-files-secure.s3.us-west-2.amazonaws.com" },
      { protocol: "https", hostname: "s3.us-west-2.amazonaws.com" },
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
                "https://source.unsplash.com",
                "https://api.deepai.org",
                "https://randomuser.me",
                "https://cataas.com",
                "https://media1.tenor.com",
                "https://i.scdn.co",
                "https://secure.notion-static.com",
                "https://www.notion.so",
                "https://prod-files-secure.notion-static.com",
                "https://notion.so",
                "https://static.notion-static.com",
                "https://images.notion.so",
                "https://img.notionusercontent.com",
                "https://prod-files-secure.s3.us-west-2.amazonaws.com",
                "https://s3.us-west-2.amazonaws.com",
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
