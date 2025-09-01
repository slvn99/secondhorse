import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
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
};

export default nextConfig;
