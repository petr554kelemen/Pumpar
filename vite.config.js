import { defineConfig } from 'vite';

export default defineConfig({
  // Relativní cesty: funguje lokálně (npm run dev) i na GitHub Pages (/Pumpar/).
  base: './',
  build: {
    chunkSizeWarningLimit: 1600, // samotný Phaser má ~1,3 MB – varování je zbytečné
  },
  server: {
    host: true, // dostupné i z telefonu v domácí síti (pro pozdější testy)
  },
});
