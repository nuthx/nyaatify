export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initDb } = await import("@/lib/db")
    const { startAllTasks } = await import("@/lib/schedule")

    await initDb();
    await startAllTasks();
  }
}
