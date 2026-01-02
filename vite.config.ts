
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Load env file based on `mode` in the current working directory.
    const env = loadEnv(mode, process.cwd(), '');
    
    return {
      server: {
        host: true,
      },
      plugins: [react()],
      define: {
        // Memastikan API_KEY tersedia untuk digunakan oleh SDK Google GenAI
        'process.env.API_KEY': JSON.stringify(env.API_KEY || env.GEMINI_API_KEY || ""),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.API_KEY || "")
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './'),
        }
      },
      build: {
        outDir: 'dist',
        sourcemap: false
      }
    };
});
