import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';
import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cors());

  // Twilio Lazy Initialization
  let twilioClient: twilio.Twilio | null = null;
  function getTwilio() {
    if (!twilioClient) {
      const sid = process.env.TWILIO_ACCOUNT_SID;
      const token = process.env.TWILIO_AUTH_TOKEN;
      if (!sid || !token) {
        throw new Error('TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are required');
      }
      twilioClient = twilio(sid, token);
    }
    return twilioClient;
  }

  // API Routes
  app.post('/api/alert', async (req, res) => {
    try {
      const { to, message } = req.body;
      if (!to || !message) {
        return res.status(400).json({ error: 'Missing to or message' });
      }

      const client = getTwilio();
      const from = process.env.TWILIO_PHONE_NUMBER;

      if (!from) {
        throw new Error('TWILIO_PHONE_NUMBER is required');
      }

      const result = await client.messages.create({
        body: message,
        to,
        from,
      });

      res.json({ success: true, sid: result.sid });
    } catch (error: any) {
      console.error('Twilio Error:', error);
      res.status(500).json({ error: error.message || 'Failed to send SMS' });
    }
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Vite middleware for development
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
