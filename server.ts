import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import {
  loadDatabase,
  getEmployees,
  authPin,
  upsertEmployee,
  deleteEmployee,
  getGlobalTemplates,
  upsertGlobalTemplate,
  deleteGlobalTemplate,
  getPersonalTemplates,
  upsertPersonalTemplate,
  deletePersonalTemplate,
  proposePersonalTemplate,
  moderatePersonalTemplate,
  getSettings,
  updateSettings,
  onDatabaseChange,
} from './server/db';

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // Initialize DB immediately
  loadDatabase();

  app.use(express.json());

  // CORS & Security headers
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // -----------------------------------------------------------------
  // API ROUTES
  // -----------------------------------------------------------------

  // Health
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
  });

  // Complete Sync
  app.get('/api/sync', (req: Request, res: Response) => {
    const db = loadDatabase();
    res.json(db);
  });

  // Auth by PIN
  app.post('/api/auth/pin', (req: Request, res: Response) => {
    const { pin } = req.body || {};
    if (!pin) {
      return res.status(400).json({ success: false, error: 'PIN-код не указан' });
    }
    const result = authPin(String(pin));
    if (!result.success) {
      return res.status(401).json(result);
    }
    return res.json(result);
  });

  // Employees
  app.get('/api/employees', (req: Request, res: Response) => {
    res.json(getEmployees());
  });

  app.post('/api/employees', (req: Request, res: Response) => {
    const { employee, actorId, actorPin } = req.body || {};
    if (!employee) {
      return res.status(400).json({ success: false, error: 'Данные сотрудника отсутствуют' });
    }
    const result = upsertEmployee(employee, actorId, actorPin);
    if (!result.success) {
      return res.status(403).json(result);
    }
    res.json(result);
  });

  app.delete('/api/employees/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const actorId = req.query.actorId as string || req.body?.actorId;
    const actorPin = req.query.actorPin as string || req.body?.actorPin;
    const result = deleteEmployee(id, actorId, actorPin);
    if (!result.success) {
      return res.status(403).json(result);
    }
    res.json(result);
  });

  // Global Templates
  app.get('/api/templates', (req: Request, res: Response) => {
    res.json(getGlobalTemplates());
  });

  app.post('/api/templates', (req: Request, res: Response) => {
    const { template, actorId, actorPin } = req.body || {};
    if (!template) {
      return res.status(400).json({ success: false, error: 'Данные шаблона отсутствуют' });
    }
    const result = upsertGlobalTemplate(template, actorId, actorPin);
    if (!result.success) {
      return res.status(403).json(result);
    }
    res.json(result);
  });

  app.delete('/api/templates/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const actorId = req.query.actorId as string || req.body?.actorId;
    const actorPin = req.query.actorPin as string || req.body?.actorPin;
    const result = deleteGlobalTemplate(id, actorId, actorPin);
    if (!result.success) {
      return res.status(403).json(result);
    }
    res.json(result);
  });

  // Personal Templates
  app.get('/api/personal-templates', (req: Request, res: Response) => {
    res.json(getPersonalTemplates());
  });

  app.post('/api/personal-templates', (req: Request, res: Response) => {
    const { template } = req.body || {};
    if (!template) {
      return res.status(400).json({ success: false, error: 'Данные личного шаблона отсутствуют' });
    }
    const result = upsertPersonalTemplate(template);
    res.json(result);
  });

  app.delete('/api/personal-templates/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const result = deletePersonalTemplate(id);
    res.json(result);
  });

  app.post('/api/personal-templates/:id/propose', (req: Request, res: Response) => {
    const { id } = req.params;
    const result = proposePersonalTemplate(id);
    if (!result.success) {
      return res.status(404).json(result);
    }
    res.json(result);
  });

  app.post('/api/personal-templates/:id/moderate', (req: Request, res: Response) => {
    const { id } = req.params;
    const { action, modifiedTemplate, actorId, actorPin } = req.body || {};
    if (action !== 'approve' && action !== 'reject') {
      return res.status(400).json({ success: false, error: 'Неверное действие модерации' });
    }
    const result = moderatePersonalTemplate(id, action, modifiedTemplate, actorId, actorPin);
    if (!result.success) {
      return res.status(403).json(result);
    }
    res.json(result);
  });

  // Settings
  app.get('/api/settings', (req: Request, res: Response) => {
    res.json(getSettings());
  });

  app.put('/api/settings', (req: Request, res: Response) => {
    const { settings, actorId, actorPin } = req.body || {};
    const result = updateSettings(settings, actorId, actorPin);
    if (!result.success) {
      return res.status(403).json(result);
    }
    res.json(result);
  });

  // Real-time Server-Sent Events (SSE)
  app.get('/api/events', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Initial greeting
    res.write(`event: connected\ndata: ${JSON.stringify({ time: new Date().toISOString() })}\n\n`);

    const unsubscribe = onDatabaseChange((eventType, payload) => {
      res.write(`event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`);
    });

    const pingInterval = setInterval(() => {
      res.write(': ping\n\n');
    }, 20000);

    req.on('close', () => {
      clearInterval(pingInterval);
      unsubscribe();
      res.end();
    });
  });

  // -----------------------------------------------------------------
  // STATIC / VITE MIDDLEWARE
  // -----------------------------------------------------------------
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    // Handle both / and /aquahelp
    app.use((req, res, next) => {
      // If someone accesses root without /aquahelp, rewrite URL if vite base requires it
      if (req.url === '/aquahelp' || req.url === '/aquahelp/') {
        req.url = '/';
      } else if (req.url.startsWith('/aquahelp/')) {
        req.url = req.url.replace('/aquahelp/', '/');
      }
      vite.middlewares(req, res, next);
    });
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.use('/aquahelp', express.static(distPath));
      app.get('*', (req: Request, res: Response) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    } else {
      app.get('*', (req: Request, res: Response) => {
        res.status(503).send('Application build not found. Run npm run build.');
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SuzdalAqua Server] Local database ready at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[SuzdalAqua Server] Startup error:', err);
  process.exit(1);
});
