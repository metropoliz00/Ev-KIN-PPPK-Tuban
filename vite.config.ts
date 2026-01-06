
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// Import process explicitly to ensure Node.js types are available for process.cwd()
import process from 'node:process';

export default defineConfig(({ mode }) => {
    // Gunakan process.cwd() untuk keandalan di server deployment (Vercel)
    const env = loadEnv(mode, process.cwd(), '');
    
    return {
      server: {
        host: true,
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.API_KEY || env.GEMINI_API_KEY || ""),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.API_KEY || "")
      },
      build: {
        outDir: 'dist',
        sourcemap: false
      }
    };
});
