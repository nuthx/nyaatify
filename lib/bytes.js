// Add units to bytes and convert to a readable format
export function formatBytes(bytes) {
  const bytesInt = parseInt(bytes);

  // If bytes is null, undefined, or not a number, return 0 B
  if (isNaN(bytesInt) || bytesInt === 0) {
    return "0 B";
  }

  const sizes = ["B", "KiB", "MiB", "GiB", "TiB"];
  const i = Math.floor(Math.log(bytesInt) / Math.log(1024));
  const value = bytesInt / Math.pow(1024, i);
  return `${i <= 1 ? Math.floor(value) : value.toFixed(1)} ${sizes[i]}`;
}
