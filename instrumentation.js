export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initConfigs, initUser } = await import("@/lib/db")
    const { startAllTasks } = await import("@/lib/core/schedule")

    await initConfigs();
    await initUser();
    await startAllTasks();
  }
}
