import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse (via pdfjs-dist) precisa rodar sem bundling para resolver
  // corretamente o build Node em vez do worker de navegador.
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
