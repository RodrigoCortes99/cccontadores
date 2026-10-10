import { spawn } from 'node:child_process';
// Dedicated demo ports prevent requests from reaching an existing real backend.
const benchmark = process.argv.includes('--benchmark');
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--webpack', '--hostname', '127.0.0.1', '--port', benchmark ? '3012' : '3011'], {
  stdio: 'inherit',
  env: { ...process.env, CAROVA_BENCHMARK_DEV: benchmark ? 'true' : 'false', NEXT_PUBLIC_API_URL: benchmark ? 'http://127.0.0.1:8012' : 'http://127.0.0.1:8011', NEXT_PUBLIC_CAROVA_AI_ENABLED: 'true', NEXT_TELEMETRY_DISABLED: '1' },
});
child.on('exit', code => process.exit(code ?? 1));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
