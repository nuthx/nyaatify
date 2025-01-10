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
    const configRows = await db.all("SELECT key, value FROM config");
    const config = configRows.reduce((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {});
    
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
    const existingKeys = await db.all("SELECT key FROM config");
    const validKeys = existingKeys.map(row => row.key);
    
    for (const configKey of Object.keys(data)) {
      if (!validKeys.includes(configKey)) {
        return Response.json({ error: `Invalid config name: ${configKey}` }, { status: 400 });
      }
    }

    // If save ai config, use a testing title to check if ai config valid
    if (data.ai_priority === "ai") {
      const result = await testOpenAI(data);
      if (result !== "success") {
        return Response.json({ error: result }, { status: 400 });
      }
    }

    // Update config with transaction
    await db.run('BEGIN TRANSACTION');
    
    for (const [key, value] of Object.entries(data)) {
      await db.run(
        "UPDATE config SET value = ? WHERE key = ?",
        [value, key]
      );
    }
    
    await db.run('COMMIT');
    return Response.json({});
  }

  catch (error) {
    await db.run('ROLLBACK');
    log.error(`Failed to edit config: ${error.message}`);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
