import moment from "moment-timezone";
import winston from "winston";
import "winston-daily-rotate-file";

const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

export const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({
      format: () => moment().tz(localTimezone).format()
    }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.DailyRotateFile({
      filename: "data/logs/%DATE%-combined.log",
      datePattern: "YYYY-MM-DD",
      maxFiles: "60d",
      level: "info"
    })
  ]
});

// Always output logs to the console
logger.add(new winston.transports.Console({
  format: winston.format.simple(),
  level: "debug"
}));
