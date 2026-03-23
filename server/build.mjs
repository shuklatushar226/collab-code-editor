/**
 * esbuild script for production bundling.
 *
 * Why esbuild instead of tsc?
 *   - Resolves TypeScript path aliases (e.g. @collab-editor/shared → ../shared/src)
 *   - Bundles the shared package INLINE — no workspace resolution needed at runtime
 *   - All node_modules kept external (pg, ioredis, etc. loaded from node_modules)
 *   - ~10x faster than tsc
 */
import * as esbuild from 'esbuild';
import { copyFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  outfile: 'dist/index.js',
  // Keep all node_modules external (they'll be in the production node_modules)
  // but INLINE the @collab-editor/shared workspace package (it resolves to ../shared/src)
  packages: 'external',
  // Override: don't treat the shared workspace package as external — bundle it in
  plugins: [
    {
      name: 'inline-shared',
      setup(build) {
        build.onResolve({ filter: /^@collab-editor\/shared$/ }, () => ({
          path: resolve(__dirname, '../shared/src/index.ts'),
        }));
      },
    },
  ],
  tsconfig: 'tsconfig.json',
  sourcemap: true,
  minify: false,
  logLevel: 'info',
});

// Copy SQL migrations alongside the bundle
mkdirSync('dist/db/migrations', { recursive: true });
copyFileSync(
  'src/db/migrations/001_init.sql',
  'dist/db/migrations/001_init.sql'
);

console.log('✓ Build complete → dist/index.js');
