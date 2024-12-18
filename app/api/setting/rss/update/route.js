import { rssSchedule } from "@/lib/schedule";

export async function GET() {
  try {
    await rssSchedule();
    return Response.json({
      code: 200,
      message: "success"
    });
  }

  catch (error) {
    return Response.json({
      code: 500,
      message: error.message
    }, { status: 500 });
  }
}
