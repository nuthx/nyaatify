import { getDb } from "@/lib/db";
import { log } from "@/lib/log";

// Add a new download server
// Method: POST
// Body: {
//   type: string,
//   name: string,
//   url: string,
//   username: string,
//   password: string
// }

export async function POST(request) {
  const db = await getDb();
  const data = await request.json();

  try {
    // Check if name already exists
    const existingName = await db.get("SELECT name FROM server WHERE name = ?", data.name);
    if (existingName) {
      return Response.json({
        code: 400,
        message: "name exists"
      }, { status: 400 });
    }

    // Check if url already exists
    const existingUrl = await db.get("SELECT url FROM server WHERE url = ?", data.url);
    if (existingUrl) {
      return Response.json({
        code: 400,
        message: "url exists"
      }, { status: 400 });
    }

    // Insert to database
    await db.run(
      "INSERT INTO server (name, url, type, username, password, cookie) VALUES (?, ?, ?, ?, ?, ?)", 
      [data.name, data.url, data.type, data.username, data.password, ""]
    );

    log.info(`Download server added successfully, name: ${data.name}, url: ${data.url}`);
    return Response.json({
      code: 200,
      message: "success"
    });
  }
  
  catch (error) {
    log.error(`Failed to add download server: ${error}`);
    return Response.json({
      code: 500,
      message: error.message
    }, { status: 500 });
  }
}
