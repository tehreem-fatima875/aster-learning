import mongoose from "mongoose";

export type DatabaseMode = "memory" | "mongodb";

export function databaseMode(): DatabaseMode {
  const mode = process.env.DATABASE_MODE;
  if (mode !== "memory" && mode !== "mongodb") {
    throw new Error("DATABASE_MODE must be set to either 'memory' or 'mongodb'.");
  }
  if (mode === "memory" && process.env.NODE_ENV === "production") {
    throw new Error("The volatile memory adapter is for local development only. Use DATABASE_MODE=mongodb in production.");
  }
  return mode;
}

export function databaseHealth(): { mode: DatabaseMode; status: "ready" | "disconnected" } {
  const mode = databaseMode();
  if (mode === "memory") return { mode, status: "ready" };
  return { mode, status: mongoose.connection.readyState === 1 ? "ready" : "disconnected" };
}

export async function connectDatabase(): Promise<void> {
  const mode = databaseMode();
  if (mode === "memory") return;
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) throw new Error("MONGODB_URI is required when DATABASE_MODE=mongodb. Set it in Backend/.env.");
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    appName: "Aster Learning"
  });
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
}
