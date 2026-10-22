// utils/logger.js
const winston = require('winston');
const { format, transports } = winston;

// Créer un format personnalisé pour les logs
const customFormat = format.printf(({ level, message, timestamp }) => {
  return `${timestamp} ${level}: ${message}`;
});

// Créer le logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: 'chatbot-service' },
  transports: [
    // Écrire tous les logs dans la console
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        customFormat
      )
    }),
    // Écrire les logs d'erreur dans un fichier
    new transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.json()
      )
    }),
    // Écrire tous les logs dans un fichier
    new transports.File({ 
      filename: 'logs/combined.log',
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.json()
      )
    })
  ]
});

// Si nous ne sommes pas en production, afficher les logs dans la console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: format.combine(
      format.colorize(),
      format.simple()
    )
  }));
}

module.exports = logger;
