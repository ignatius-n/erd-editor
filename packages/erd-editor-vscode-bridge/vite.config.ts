import { readFileSync } from 'node:fs';

import typescript from '@rollup/plugin-typescript';
import { visualizer } from 'rollup-plugin-visualizer';
import tspCompiler from 'ts-patch/compiler';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

const pkg = JSON.parse(readFileSync('package.json', { encoding: 'utf8' }));

export default defineConfig({
  build: {
    lib: {
      entry: './src/index.ts',
      name: pkg.name,
      fileName: 'bridge',
      formats: ['es'],
    },
  },
  plugins: [
    tsconfigPaths(),
    visualizer({ filename: './dist/stats.html' }),
    typescript({
      typescript: tspCompiler,
      noEmitOnError: true,
      compilerOptions: {
        declaration: true,
        outDir: './dist',
        plugins: [
          {
            transform: 'typescript-transform-paths',
            afterDeclarations: true,
          },
        ],
      },
    }),
  ],
  server: {
    open: true,
  },
});
