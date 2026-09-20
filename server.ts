import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { initDb } from './server/db.js';
import { apiRouter } from './server/api.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Initialize Relational Database
  console.log('Initializing Strykon Relational Database...');
  await initDb();
  console.log('Strykon Database Ready in clean operational state.');

  // Mount API Router FIRST
  app.use('/api', apiRouter);

  // Serve standalone exportable HTML file
  app.get('/strykon-finance.html', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'strykon-finance.html'));
  });
  app.get('/api/download-standalone', (req, res) => {
    res.download(path.join(process.cwd(), 'strykon-finance.html'), 'strykon-finance.html');
  });

  // Vite middleware for development or Static Serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Strykon Finance OS running on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal Server Startup Error:', err);
  process.exit(1);
});
