import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  // Relativní cesty: funguje lokálně (npm run dev) i na GitHub Pages (/Pumpar/).
  base: './',
  build: {
    chunkSizeWarningLimit: 1600, // samotný Phaser má ~1,3 MB – varování je zbytečné
    rolldownOptions: {
      // Více stránek: hra + tisk visaček (pro rodiče).
      input: {
        hra: resolve(import.meta.dirname, 'index.html'),
        tisk: resolve(import.meta.dirname, 'tisk.html'),
      },
    },
  },
  server: {
    host: true, // dostupné i z telefonu v domácí síti (pro pozdější testy)
  },
});
