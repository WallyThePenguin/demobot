import { Pool } from "./../../deps.ts";
import { init } from "./database.ts";
import { GameUserSchema, CardUserSchema } from "./schemas.ts";
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
//**Check if data exists */
export async function gamedatacheck(user: bigint): Promise<boolean> {
  const check = await runQuery(`SELECT 1 FROM "GameUserSchema" WHERE id = $1 LIMIT 1`, [user]);
  if (check.length === 0) return false;
  else return true;
}
//**Check if the user enabled dms */
export async function dmdatacheck(user: bigint): Promise<boolean> {
  const [check] = await runQuery<GameUserSchema>(`SELECT dm FROM "GameUserSchema" WHERE id = $1 LIMIT 1`, [user]);
  if (check.dm === true) return true;
  else return false;
}
interface userdata extends Record<string, unknown> {
  //**Money */
  money: number;
  //**Amount of health you have */
  health?: number;
  //**Amount of Attack Dmg you have */
  basicattack?: number;
  //**Amount of Ability Power you have */
  abilitypower?: number;
  //**Amount of Speed, if you get to move first or not */
  speed?: number;
  //**Amount Of Luck you have (For Drops) */
  luck?: number;
  //**For Strategists */
  chance?: number;
  //**CritChance, basically chanceroll for extra dmg. */
  critchance?: number;
  //**How big of a multiplier you get when you land crit. */
  critdmgmultiplier?: number;
  //**Defense, Basically Going to subtract from attack dmg when getting hit. */
  defense?: number;
}
//**Look at User Stats. */
export async function statdata(user: bigint): Promise<userdata> {
  const [userdata] = await runQuery<GameUserSchema>(
    `SELECT money, health, basicattack, abilitypower, speed, luck, chance, critchance, critdmgmultiplier, defense FROM "GameUserSchema" WHERE id = $1 LIMIT 1`,
    [user]
  );
  return userdata;
}
interface carddata {
  cards: [];
}
//**Look at User Card Stats */
export async function findcardData(user: bigint): Promise<carddata[]> {
  const [cardfind] = await runQuery<CardUserSchema>(`SELECT cards FROM CardUserSchema WHERE id = $1 LIMIT 1`, [user]);
  return cardfind.cards;
}
interface deckdata {
  deck: [];
}
//**Look at User Deck */
export async function findDeckdata(user: bigint): Promise<deckdata[]> {
  const [deckfind] = await runQuery<CardUserSchema>(`SELECT deck FROM CardUserSchema WHERE id = $1`, [user]);
  return deckfind.deck;
}
await init();
