require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const { helmetMiddleware, corsMiddleware, apiLimiter } = require('./middleware/security');
const logger = require('./config/logger');
const { initDatabase } = require('./config/database');

const app = express();
const { initScheduler } = require('./services/scheduler');

initDatabase();
if (process.env.NODE_ENV !== 'test') initScheduler();

app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));
app.use(morgan('combined', { stream: { write: msg => logger.http(msg.trim()) } }));
app.use('/api/', apiLimiter);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/pipeline', require('./routes/pipeline'));
app.use('/api/accounting', require('./routes/accounting'));
app.use('/api/fiscal', require('./routes/fiscal'));
app.use('/api/training', require('./routes/training'));
app.use('/api/agents', require('./routes/agents'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'DJA.MAINT', timestamp: new Date().toISOString() });
});

// 404
app.use((req, res) => res.status(404).json({ error: 'Route introuvable' }));

// Error handler
app.use((err, req, res, next) => {
  logger.error(err.message, { stack: err.stack });
  res.status(err.status || 500).json({ error: process.env.NODE_ENV === 'production' ? 'Erreur serveur' : err.message });
});

module.exports = app;
