export function formatBytes(bytes) {
  if (bytes === undefined) {
    return "0 B";
  }

  if (bytes === 0) {
    return "0 B";
  }

  const bytesInt = parseInt(bytes);
  const sizes = ["B", "KiB", "MiB", "GiB", "TiB"];
  const i = Math.floor(Math.log(bytesInt) / Math.log(1024));
  const value = bytesInt / Math.pow(1024, i);
  return `${i <= 1 ? Math.floor(value) : value.toFixed(1)} ${sizes[i]}`;
}
