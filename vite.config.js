import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

function adminApiPlugin() {
  return {
    name: 'admin-api-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/api/products' && req.method === 'GET') {
          const filePath = path.resolve(__dirname, 'src/data/products.json');
          if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf-8');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(data);
          } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify([]));
          }
          return;
        }

        if (req.url === '/api/products' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            const filePath = path.resolve(__dirname, 'src/data/products.json');
            fs.writeFileSync(filePath, body, 'utf-8');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
          });
          return;
        }

        if (req.url === '/api/reviews' && req.method === 'GET') {
          const filePath = path.resolve(__dirname, 'src/data/reviews.json');
          if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf-8');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(data);
          } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify([]));
          }
          return;
        }

        if (req.url === '/api/reviews' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            const filePath = path.resolve(__dirname, 'src/data/reviews.json');
            fs.writeFileSync(filePath, body, 'utf-8');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
          });
          return;
        }

        if (req.url === '/api/images' && req.method === 'GET') {
          const dirPath = path.resolve(__dirname, 'public/assets');
          if (fs.existsSync(dirPath)) {
            const files = fs.readdirSync(dirPath);
            const images = files.filter(file => /\.(png|jpe?g|svg|webp|gif)$/i.test(file));
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(images));
          } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify([]));
          }
          return;
        }

        if (req.url === '/api/feedback-images' && req.method === 'GET') {
          const dirPath = path.resolve(__dirname, 'public/assets/feedback_images');
          if (fs.existsSync(dirPath)) {
            const files = fs.readdirSync(dirPath);
            const images = files.filter(file => /\.(png|jpe?g|svg|webp|gif)$/i.test(file));
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(images));
          } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify([]));
          }
          return;
        }

        if (req.url === '/api/upload' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const { filename, base64 } = JSON.parse(body);
              if (!filename || !base64) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Missing filename or base64 data' }));
                return;
              }
              const buffer = Buffer.from(base64, 'base64');
              const dirPath = path.resolve(__dirname, 'public/assets');
              if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
              }
              const filePath = path.resolve(dirPath, filename);
              fs.writeFileSync(filePath, buffer);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, url: `/assets/${filename}` }));
            } catch (err) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), adminApiPlugin()],
})
