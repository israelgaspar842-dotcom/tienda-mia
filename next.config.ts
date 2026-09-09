import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.100.16"],
  images: {
    remotePatterns: [
      // permite imágenes externas si en el futuro usas CDN
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
