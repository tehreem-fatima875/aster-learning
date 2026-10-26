import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { databaseHealth, databaseMode } from "./database";

const previousMode = process.env.DATABASE_MODE;
const previousEnvironment = process.env.NODE_ENV;

afterEach(() => {
  if (previousMode === undefined) delete process.env.DATABASE_MODE;
  else process.env.DATABASE_MODE = previousMode;
  if (previousEnvironment === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = previousEnvironment;
});

test("memory mode is explicitly ready and reports the selected adapter", () => {
  process.env.DATABASE_MODE = "memory";
  process.env.NODE_ENV = "development";
  assert.deepEqual(databaseHealth(), { mode: "memory", status: "ready" });
});

test("MongoDB mode reports disconnected until Mongoose is connected", () => {
  process.env.DATABASE_MODE = "mongodb";
  process.env.NODE_ENV = "development";
  assert.deepEqual(databaseHealth(), { mode: "mongodb", status: "disconnected" });
});

test("unknown database modes fail configuration validation", () => {
  process.env.DATABASE_MODE = "mock";
  assert.throws(() => databaseMode(), /DATABASE_MODE must be set/);
});

test("production cannot use the volatile memory adapter", () => {
  process.env.DATABASE_MODE = "memory";
  process.env.NODE_ENV = "production";
  assert.throws(() => databaseMode(), /volatile memory adapter/);
});
