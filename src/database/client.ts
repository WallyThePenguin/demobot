import { Pool } from "./../../deps.ts";
import { init } from "./database.ts";
const dbPool = new Pool(
  {
    user: "postgres",
    password: "waleed12",
    database: "postgres",
    hostname: "localhost",
    port: 5432,
  },
  20
);

export async function runQuery<T extends Record<string, unknown>>(
  query: string,
  //deno-lint-ignore no-explicit-any
  params?: Array<any>
): Promise<Array<T>> {
  const client = await dbPool.connect();
  const dbResult = await client.queryObject<T>({
    text: query,
    args: params,
  });
  client.release();
  return dbResult.rows;
}
await init();
