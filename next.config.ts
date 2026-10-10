import type { NextConfig } from "next";

const realModelDemo = process.env.CAROVA_REAL_MODEL_DEMO === 'true';
const nextConfig: NextConfig = {
  ...(process.env.ACCOUNTING_OS_HARDENING_LAB === 'true' && process.env.ACCOUNTING_OS_HARDENING_TSC_CONFIG ? {typescript: {tsconfigPath: process.env.ACCOUNTING_OS_HARDENING_TSC_CONFIG}} : {}),
  // The isolated lab must never inherit a production URL from .env.local.
  ...(realModelDemo ? {env: {NEXT_PUBLIC_API_URL: 'http://127.0.0.1:8012'}} : {}),
  // Keep the controlled pilot's development cache separate from the existing demo.
  distDir: process.env.ACCOUNTING_OS_HARDENING_LAB === 'true' ? '.next-accounting-hardening-lab' : process.env.ACCOUNTING_OS_LAB === 'true' ? '.next-accounting-os-lab' : process.env.CAROVA_REAL_MODEL_DEMO === 'true' ? '.next-real-model' : process.env.CAROVA_BENCHMARK_DEV === 'true' ? '.next-benchmark' : '.next',
};

export default nextConfig;
