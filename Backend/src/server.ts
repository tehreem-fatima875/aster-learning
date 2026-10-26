import app, { initializeApplicationData } from "./app";
import { connectDatabase, databaseMode, disconnectDatabase } from "./config/database";

async function start(): Promise<void> {
  const mode = databaseMode();
  await connectDatabase();
  await initializeApplicationData();

  const port = Number(process.env.PORT ?? 4000);
  const server = app.listen(port, () => {
    console.log(`Aster Learning API listening on http://localhost:${port} (database mode: ${mode})`);
  });

  const shutdown = (signal: string) => {
    console.log(`Received ${signal}; shutting down Aster Learning API.`);
    server.close(() => {
      void disconnectDatabase().then(() => process.exit(0)).catch(error => {
        console.error("Database disconnect failed during shutdown.", error);
        process.exit(1);
      });
    });
  };
  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
}

start().catch(error => {
  console.error(`Aster Learning API failed to start: ${error instanceof Error ? error.message : "unknown startup error"}`);
  process.exitCode = 1;
});
