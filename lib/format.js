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

// Format ETA to hours, minutes, seconds
export function formatEta(seconds) {
  if (seconds === 8640000) return {};  // Special value, return empty object
  
  // Convert all time to hours, minutes, seconds
  const hours = Math.floor(seconds / 3600);
  seconds = seconds % 3600;
  const minutes = Math.floor(seconds / 60);
  seconds = seconds % 60;

  // Pad with leading zeros to ensure at least 2 digits
  const result = {
    h: hours.toString().padStart(2, "0"),
    m: minutes.toString().padStart(2, "0"), 
    s: Math.floor(seconds).toString().padStart(2, "0")
  };

  return result;
}
