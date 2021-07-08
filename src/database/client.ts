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
export async function gamedatacheck(user: bigint): Promise<boolean> {
  const check = await runQuery(`SELECT 1 FROM "GameUserSchema" WHERE id = $1 LIMIT 1`, [user]);
  if (check.length === 0) return false;
  else return true;
}
await init();
