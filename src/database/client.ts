import { Pool } from "./../../deps.ts";
import { init } from "./database.ts";
import { GameUserSchema, globalcardlist } from "./schemas.ts";
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
    `SELECT money, health, basicattack, abilitypower, speed, luck, chance, critchance, critdmgmultiplier, defense, xp FROM "GameUserSchema" WHERE id = $1 LIMIT 1`,
    [user]
  );
  return userdata;
}
interface xplevel extends Record<string, unknown> {
  xp: number;
  level: number;
  levelup?: boolean;
}
//Get xp requirement for each level
export function xpforlevel(level: number) {
  const xpmini = Math.floor((level + 10) ** (9 / 5));
  const xpmax = Math.floor((level + 11) ** (9 / 5) - 1);
  return { levelminimum: xpmini, levelmaximum: xpmax };
}
//Convert user xp to level
export async function checklevel(user: bigint): Promise<xplevel> {
  const xpamount = await runQuery<GameUserSchema>(`SELECT xp FROM "GameUserSchema" WHERE id = $1`, [user]);
  const userlevel = Math.floor(xpamount[0].xp ** (5 / 9) - 10);
  return { xp: xpamount[0].xp, level: userlevel };
}

//Give or Take xp of a user
export async function xpchange(user: bigint, xp: number, give: true): Promise<xplevel> {
  const oldamount = await checklevel(user);
  await runQuery(`UPDATE "GameUserSchema" SET "xp" = "xp" ${give ? "+" : "-"} $2 WHERE id = $1`, [user, xp]);
  const newamount = await checklevel(user);
  console.log(
    `${xp} of ${give} XP Given to ${user}! Before: ${oldamount.xp} LVL${oldamount.level}, After: ${newamount.xp}, LVL${newamount.level}!`
  );
  const check = oldamount.level === newamount.level;
  return { xp: newamount.xp, level: newamount.level, levelup: check };
}

//CREATE A CARD
export async function cardcreate(
  name: string,
  level: number,
  attack: number,
  defence: number,
  speed: number,
  imagelink: string,
  description: string,
  rarity: number
): Promise<globalcardlist> {
  const [newcard] = await runQuery<globalcardlist>(
    `INSERT INTO globalcardlist (name, level, attack, defence, speed, imagelink, description, rarity) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [name, level, attack, defence, speed, imagelink, description, rarity]
  );
  console.log(newcard);
  return {
    name: newcard.name,
    level: newcard.level,
    attack: newcard.attack,
    defence: newcard.defence,
    speed: newcard.speed,
    imagelink: newcard.imagelink,
    description: newcard.description,
    rarity: newcard.rarity,
  };
}
