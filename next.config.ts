import type { NextConfig } from "next";

const realModelDemo = process.env.CAROVA_REAL_MODEL_DEMO === 'true';
const nextConfig: NextConfig = {
  // The isolated lab must never inherit a production URL from .env.local.
  ...(realModelDemo ? {env: {NEXT_PUBLIC_API_URL: 'http://127.0.0.1:8012'}} : {}),
  // Keep the controlled pilot's development cache separate from the existing demo.
  distDir: process.env.CAROVA_REAL_MODEL_DEMO === 'true' ? '.next-real-model' : process.env.CAROVA_BENCHMARK_DEV === 'true' ? '.next-benchmark' : '.next',
};

export default nextConfig;
