function formatTime() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

const log = {
  info(content) {
    console.log(`[${formatTime()}] ${content}`);
  },

  error(content) {
    console.error(`[${formatTime()}] ${content}`);
  }
};

export default log;
