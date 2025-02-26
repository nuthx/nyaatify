import winston from "winston";
import "winston-daily-rotate-file";

export const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.DailyRotateFile({
      filename: "logs/%DATE%-combined.log",
      datePattern: "YYYY-MM-DD",
      maxFiles: "60d"
    })
  ]
});

// Always output logs to the console
logger.add(new winston.transports.Console({
  format: winston.format.simple()
}));
