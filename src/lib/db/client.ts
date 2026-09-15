import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;
const queryClient = databaseUrl ? postgres(databaseUrl, { prepare: false, max: 1 }) : null;

export const db = queryClient ? drizzle(queryClient, { schema }) : null;
export const databaseMode = db ? "postgres" : "mock";
