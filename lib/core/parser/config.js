export const parserConfig = [
  {
    type: "Mikan",
    parser: "mikan.js",
    urls: [
      "mikanani.me",
      "mikanime.tv"
    ],
    fields: [
      ["torrent", "torrent"]
    ]
  },
  {
    type: "Nyaa",
    parser: "nyaa.js",
    urls: [
      "nyaa.si",
      "nyaa.land"
    ],
    fields: [
      ["nyaa:infoHash", "hash"],
      ["nyaa:categoryId", "categoryId"],
      ["nyaa:size", "size"]
    ]
  }
]
