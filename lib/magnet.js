import { getConfig } from "@/lib/db";

// Default trackers
const defaultTrackers = [
  "udp://open.stealth.si:80/announce",
  "udp://tracker.opentrackr.org:1337/announce",
  "udp://exodus.desync.com:6969/announce",
  "udp://tracker.torrent.eu.org:451/announce",
  "udp://tr.bangumi.moe:6969/announce",
  "http://nyaa.tracker.wf:7777/announce",
  "http://t.nyaatracker.com/announce",
  "http://tracker.kamigami.org:2710/announce",
  "http://share.camoe.cn:8080/announce",
  "http://opentracker.acgnx.se/announce",
  "http://anidex.moe:6969/announce",
  "http://t.acg.rip:6699/announce",
  "https://tr.bangumi.moe:9696/announce",
  "http://open.acgtracker.com:1096/announce"
]

// Custom trackers
const customTrackers = async () => {
  const config = await getConfig();
  const trackers = config.customTrackers;
  if (!trackers) return [];
  return trackers.split("\n").filter(tracker => tracker.trim());
}

// Generate a magnet link with trackers from a hash
export async function magnet(hash) {
  const tracker = [...defaultTrackers, ...(await customTrackers())].map(tracker => `tr=${encodeURIComponent(tracker)}`).join("&");
  const magnet = `magnet:?xt=urn:btih:${hash}&${tracker}`;
  return magnet;
}
