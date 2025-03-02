import winston from "winston";
import "winston-daily-rotate-file";

export const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({
      format: () => {
        // Use local time with offset
        const date = new Date();
        return date.toISOString().replace("Z", date.getTimezoneOffset() === 0 ? "Z" : 
          `+${String(-date.getTimezoneOffset() / 60).padStart(2, "0")}:00`);
      }
    }),
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
