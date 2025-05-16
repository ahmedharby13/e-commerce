import winston from 'winston';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const levelsByEnv: { [key: string]: string } = {
    development: 'debug',
    production: 'info',
    test: 'warn',
    staging: 'info',
  };
  return levelsByEnv[env] || 'warn';
};

const getFormat = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    return winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.json()
    );
  }
  return winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(
      ({ timestamp, level, message, ...metadata }) =>
        `${timestamp} ${level}: ${message} ${
          Object.keys(metadata).length ? JSON.stringify(metadata, null, 2) : ''
        }`
    )
  );
};

const consoleFormat = winston.format.combine(
  process.env.NODE_ENV === 'production' ? winston.format.uncolorize() : winston.format.colorize(),
  getFormat()
);

const transports = [
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    maxsize: 5242880,
    maxFiles: 5,
    tailable: true,
  }),
  new winston.transports.File({
    filename: 'logs/all.log',
    maxsize: 5242880,
    maxFiles: 5,
    tailable: true,
  }),
  new winston.transports.Console({
    format: consoleFormat,
  }),
];

transports.forEach((transport) => {
  transport.on('error', (error) => {
    console.error('Winston transport error:', error);
  });
});

const logger = winston.createLogger({
  level: level(),
  levels,
  format: getFormat(),
  transports,
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' }),
    new winston.transports.Console(),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' }),
    new winston.transports.Console(),
  ],
});

logger.add(
  new winston.transports.File({
    filename: 'logs/http.log',
    level: 'http',
    maxsize: 5242880,
    maxFiles: 5,
    tailable: true,
  })
);

export default logger;