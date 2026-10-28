import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'serve-and-copy-resources',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && req.url.startsWith('/resources/')) {
            const decoded = decodeURIComponent(req.url.replace(/^\//, ''));
            const filePath = path.resolve(__dirname, decoded);
            if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
              const ext = path.extname(filePath).toLowerCase();
              const mimeTypes: Record<string, string> = {
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.svg': 'image/svg+xml',
                '.webp': 'image/webp'
              };
              res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
              fs.createReadStream(filePath).pipe(res);
              return;
            }
          }
          next();
        });
      },
      closeBundle() {
        const srcDir = path.resolve(__dirname, 'resources');
        const destDir = path.resolve(__dirname, 'dist', 'resources');
        if (fs.existsSync(srcDir)) {
          if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
          }
          const files = fs.readdirSync(srcDir);
          for (const file of files) {
            const srcPath = path.join(srcDir, file);
            if (fs.statSync(srcPath).isFile()) {
              fs.copyFileSync(srcPath, path.join(destDir, file));
            }
          }
        }
      }
    }
  ],
  server: {
    port: 5173,
    host: true
  }
});
