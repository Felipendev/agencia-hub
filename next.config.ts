import type { NextConfig } from "next";

function apiOrigin(): string {
  const raw =
    process.env.AGENCIA_HUB_API_URL ??
    process.env.NEXT_PUBLIC_AGENCIA_HUB_API_URL;
  if (!raw) return "";
  try {
    return new URL(raw.trim()).origin;
  } catch {
    return "";
  }
}

const extraConnectOrigin = apiOrigin();

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      ["connect-src 'self'", extraConnectOrigin].filter(Boolean).join(" "),
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
