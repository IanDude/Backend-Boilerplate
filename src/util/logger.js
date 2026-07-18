import winston from "winston";
import path from "node:path";
import fs from "node:fs";

const logDir = path.resolve("storage/logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const baseFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

const requestFilter = winston.format((info) => {
  return info.level === "http" ? info : false;
});

const logger = winston.createLogger({
  level: "info",
  format: baseFormat,
  transports: [
    new winston.transports.File({
      filename: `${logDir}/error.log`,
      level: "error",
    }),
    new winston.transports.File({
      filename: `${logDir}/combined.log`,
    }),
    new winston.transports.File({
      filename: `${logDir}/request.log`,
      format: winston.format.combine(requestFilter(), baseFormat),
      level: "http",
    }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          return `${timestamp} ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ""}`;
        }),
      ),
    }),
  );
}

export default logger;
