import { getDb } from "@/lib/db";
import { log } from "@/lib/log";
import { testOpenAI } from "@/lib/api/openai";

// Get all user settings
// Method: GET

// Edit user settings
// Method: POST
// Body: {
//   config_name: config_value,
//   config_name: config_value,
//   config_name: config_value,
//   ...
// }

export async function GET() {
  const db = await getDb();

  try {
    const config = await db.get("SELECT * FROM config WHERE id = 1");
    return Response.json(config);
  }

  catch (error) {
    log.error(`Failed to load config: ${error.message}`);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const data = await request.json();
  const db = await getDb();

  try {
    // Check if config name correct
    const existingConfig = await db.get("SELECT * FROM config WHERE id = 1");
    for (const configName of Object.keys(data)) {
      if (!(configName in existingConfig)) {
        return Response.json({ error: `Invalid config name: ${configName}` }, { status: 400 });
      }
    }

    // If save ai config, use a testing title to check if ai config valid
    if (data.ai_priority === "ai") {
      const result = await testOpenAI(data);
      if (result !== "success") {
        return Response.json({ error: result }, { status: 400 });
      }
    }

    // Update config
    await db.run(
      `UPDATE config SET ${Object.entries(data)
        .map(([key]) => `${key} = ?`)
        .join(", ")} WHERE id = 1`,
      Object.values(data)
    );

    return Response.json({});
  }

  catch (error) {
    log.error(`Failed to edit config: ${error.message}`);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
