import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Évite que Next.js remonte au dossier parent et confonde le workspace
  // (il y a un package-lock.json parasite dans C:\Users\user\).
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
