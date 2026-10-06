import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse (via pdfjs-dist) precisa rodar sem bundling para resolver
  // corretamente o build Node em vez do worker de navegador, e o
  // @napi-rs/canvas precisa ficar de fora do bundle por ser um módulo nativo.
  serverExternalPackages: ["pdf-parse", "@napi-rs/canvas"],
  // Site aposentado: a emissao da MANN Movel agora e feita no madeireiras-cert.
  // Redirecionamento temporario (307), facil de desfazer.
  async redirects() {
    return [{ source: "/:path*", destination: "https://madeireiras-cert.vercel.app", permanent: false }];
  },
};

export default nextConfig;
