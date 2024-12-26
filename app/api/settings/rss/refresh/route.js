import { startAllTasks } from "@/lib/schedule";

export async function GET() {
  await startAllTasks();
  return Response.json({
    code: 200,
    message: "success"
  });
}
