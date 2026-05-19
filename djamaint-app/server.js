require('dotenv').config();
const app = require('./src/app');
const logger = require('./src/config/logger');

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  logger.info(`DJA.MAINT backend démarré sur http://localhost:${PORT}`);
  logger.info(`Environnement : ${process.env.NODE_ENV || 'development'}`);
});
