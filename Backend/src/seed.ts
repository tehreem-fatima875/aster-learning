import { connectDatabase, databaseMode, disconnectDatabase } from "./config/database";
import { repository } from "./data/repository";
import { createDemoData, loadDemoData } from "./services/seedData";
import { store } from "./data/store";

async function seed(): Promise<void> {
  const mode = databaseMode();
  if (mode === "memory") {
    loadDemoData();
    console.log(`Loaded ${store.courses.length} demonstration courses in memory. They are not persisted.`);
    return;
  }
  await connectDatabase();
  try {
    const data = createDemoData();
    await repository.seedDemoData(data.users, data.courses, data.assessments);
    console.log(`Seeded ${data.courses.length} demonstration courses into MongoDB (existing seed records were left unchanged).`);
  } finally {
    await disconnectDatabase();
  }
}

seed().catch(error => {
  console.error(`Aster Learning seed failed: ${error instanceof Error ? error.message : "unknown seed error"}`);
  process.exitCode = 1;
});
