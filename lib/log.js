function formatTime() {
  const now = new Date();
  const date = now.toISOString().split("T")[0];
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");
  return `${date} ${hours}:${minutes}:${seconds}`;
}

export const log = {
  info(content) {
    console.log(`${formatTime()} | INFO | ${content}`);
  },

  warn(content) {
    console.warn(`${formatTime()} | WARN | ${content}`);
  },

  error(content) {
    console.error(`${formatTime()} | ERROR | ${content}`);
  }
};
