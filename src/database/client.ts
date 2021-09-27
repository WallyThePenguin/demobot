import { Pool } from "./../../deps.ts";
import { init } from "./database.ts";
import { GameUserSchema, globalcardlist, enemyuserschema, usercardinventory, dailyshop } from "./schemas.ts";
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
  //**Xp Value*/
  xp: number;
  //**Xp Converted to level */
  level: number;
  //**See if user leveled up or not. */
  levelup?: boolean;
}

//Get xp requirement for each level
export function xpforlevel(level: number) {
  //**Formula for minimum amount of xp for level*/
  const xpmini = Math.ceil((level + 10) ** (9 / 5));
  //**Formula for Max amount of xp for level */
  const xpmax = Math.floor((level + 11) ** (9 / 5) - 1);
  return { levelminimum: xpmini, levelmaximum: xpmax };
}

//Convert user xp to level
export async function checklevel(user: bigint): Promise<xplevel> {
  const xpamount = await runQuery<GameUserSchema>(`SELECT xp FROM "GameUserSchema" WHERE id = $1`, [user]);
  //**Simple Reciprocal formula to get userlevel for xp. */
  const userlevel = Math.floor(xpamount[0].xp ** (5 / 9) - 10);
  return { xp: xpamount[0].xp, level: userlevel };
}

//Give or Take xp of a user
export async function xpchange(user: bigint, xp: number, give = true): Promise<xplevel> {
  //**Checklevel Before being affected */
  const oldamount = await checklevel(user);
  //**Update the xp value to either take or gain xp */
  await runQuery(`UPDATE "GameUserSchema" SET "xp" = "xp" ${give ? "+" : "-"} $2 WHERE id = $1`, [user, xp]);
  //**Check level after being affected */
  const newamount = await checklevel(user);
  //**Log the xp change for now. */
  console.log(
    `${xp} of ${give} XP Given to ${user}! Before: ${oldamount.xp} LVL${oldamount.level}, After: ${newamount.xp}, LVL${newamount.level}!`
  );
  //**Check if the person levelled up */
  const check = oldamount.level !== newamount.level;
  //**IF they did, whats the difference */
  const difference = Math.abs(newamount.level - oldamount.level);
  //**If the check is true, they gain or get removed statpoints. */
  if (check === true)
    runQuery(
      `UPDATE "GameUserSchema" SET "statpoints" = "statpoints" ${give ? "+" : "-"} $2, "totalpoints" = "totalpoints" ${
        give ? "+" : "-"
      } $2 WHERE id = $1`,
      [user, difference]
    );
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
  rarity: number,
  type: string,
  magic: number
): Promise<globalcardlist> {
  //**Simple giving the parameters and logging into query. */
  const [newcard] = await runQuery<globalcardlist>(
    `INSERT INTO globalcardlist (name, level, attack, defence, speed, imagelink, description, rarity, type, magic) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
    [name, level, attack, defence, speed, imagelink, description, rarity, type, magic]
  );
  //**Log the Creation */
  console.log(newcard);
  //**Return the promise */
  return {
    id: newcard.id,
    name: newcard.name,
    level: newcard.level,
    attack: newcard.attack,
    defence: newcard.defence,
    speed: newcard.speed,
    imagelink: newcard.imagelink,
    description: newcard.description,
    rarity: newcard.rarity,
    type: newcard.type,
    magic: newcard.magic,
  };
}

//Create an Enemy
export async function enemycreate(
  name: string,
  image: string,
  type: string,
  description: string
): Promise<enemyuserschema> {
  //**Same thing as Card Create, A Bit Easier. */
  const [newenemy] = await runQuery<enemyuserschema>(
    `INSERT INTO enemyuserschema (name, image, type, description) VALUES ($1, $2, $3, $4) RETURNING *`,
    [name, image, type, description]
  );
  console.log(newenemy);
  return {
    id: newenemy.id,
    name: newenemy.name,
    image: newenemy.image,
    type: newenemy.type,
    description: newenemy.description,
  };
}

//Give users Cards.
export async function givecard(
  //The Card Being Given
  cardid: number,
  //User Getting The Card
  user: bigint,
  //Level of the card being given will always be 1 by default.
  level = 1,
  //Automatically not inside userdeck.
  isindeck = false
): Promise<usercardinventory> {
  //**Simply run a insert query to basically give the user the card. */
  const [givecard] = await runQuery<usercardinventory>(
    `INSERT INTO usercardinventory (id, userid, level, isindeck) VALUES ($1, $2, $3, $4) RETURNING *`,
    [cardid, user, level, isindeck]
  );
  console.log(givecard);
  return {
    id: givecard.id,
    cardnumber: givecard.cardnumber,
    userid: givecard.userid,
    level: givecard.level,
    isindeck: givecard.isindeck,
  };
}

//Search For a Card.
export async function searchcard(
  //Card trying to find:
  id: number
): Promise<globalcardlist> {
  const [findcard] = await runQuery<globalcardlist>(`SELECT * FROM "globalcardlist" WHERE id = $1`, [id]);
  return {
    id: findcard.id,
    name: findcard.name,
    attack: findcard.attack,
    defence: findcard.defence,
    magic: findcard.magic,
    speed: findcard.speed,
    imagelink: findcard.imagelink,
    description: findcard.description,
    rarity: findcard.rarity,
    type: findcard.type,
  };
}

//Scale Card To Level
export async function autocardscale(
  //Try for card number
  cardnumber: number
): Promise<(globalcardlist & usercardinventory) | undefined> {
  //Look For Cards Name And Cards
  const [checkcard] = await runQuery<usercardinventory & globalcardlist>(
    `SELECT * FROM "usercardinventory" INNER JOIN "globalcardlist" ON "globalcardlist"."id"="usercardinventory"."id" WHERE cardnumber = $1`,
    [cardnumber]
  );

  //Look For The Card By Name And Level
  const [lookforlevelabove] = await runQuery<globalcardlist>(
    `SELECT * FROM "globalcardlist" WHERE name = $1 and level = $2+1`,
    [checkcard.name, checkcard.level]
  );

  //Make the const a boolean value.
  const Needed = function newCardNeeded() {
    return !lookforlevelabove;
  };

  //Lets do the formula into a function.
  function TypeStatMath(
    //To Scale by Rarity
    rarity: number,
    //The Value of The Stat Currently.
    value: number,
    //Is it the main stat value or not.
    type = false
  ): number {
    if (!type) {
      const NonTypeValue = Math.ceil((rarity * 1.6 * value) / 3);
      return NonTypeValue;
    } else {
      const TypeValue = Math.ceil((rarity * 1.9 * value) / 3);
      return TypeValue;
    }
  }
  //THE MAIN PART!!!!
  if (Needed()) {
    //If True We Need to create a new card with bonus stats in my globalcardlist, and then edit the users cardlevel and id.
    switch (checkcard.type) {
      case "attack": {
        const query = await cardcreate(
          checkcard.name,
          checkcard.level + 1,
          TypeStatMath(checkcard.rarity, checkcard.attack, true),
          TypeStatMath(checkcard.rarity, checkcard.defence),
          TypeStatMath(checkcard.rarity, checkcard.speed),
          checkcard.imagelink,
          checkcard.description,
          checkcard.rarity,
          checkcard.type,
          TypeStatMath(checkcard.rarity, checkcard.magic)
        );
        const [updateusercard] = await runQuery<usercardinventory>(
          `UPDATE "usercardinventory" SET "id"=$2, "level"=$3 WHERE userid = $1 and cardnumber = $4 RETURNING *`,
          [checkcard.userid, query.id, query.level, checkcard.cardnumber]
        );
        return {
          id: updateusercard.id,
          userid: updateusercard.userid,
          level: updateusercard.level,
          cardnumber: cardnumber,
          isindeck: updateusercard.isindeck,
          name: query.name,
          attack: query.attack,
          defence: query.defence,
          speed: query.speed,
          imagelink: query.imagelink,
          description: query.description,
          rarity: query.rarity,
          type: query.type,
          magic: query.magic,
        };
      }
      case "tank": {
        const query = await cardcreate(
          checkcard.name,
          checkcard.level + 1,
          TypeStatMath(checkcard.rarity, checkcard.attack),
          TypeStatMath(checkcard.rarity, checkcard.defence, true),
          TypeStatMath(checkcard.rarity, checkcard.speed),
          checkcard.imagelink,
          checkcard.description,
          checkcard.rarity,
          checkcard.type,
          TypeStatMath(checkcard.rarity, checkcard.magic)
        );
        const [updateusercard] = await runQuery<usercardinventory>(
          `UPDATE "usercardinventory" SET "id"=$2, "level"=$3 WHERE userid = $1 and cardnumber = $4 RETURNING *`,
          [checkcard.userid, query.id, query.level, checkcard.cardnumber]
        );
        return {
          id: updateusercard.id,
          userid: updateusercard.userid,
          level: updateusercard.level,
          cardnumber: cardnumber,
          isindeck: updateusercard.isindeck,
          name: query.name,
          attack: query.attack,
          defence: query.defence,
          speed: query.speed,
          imagelink: query.imagelink,
          description: query.description,
          rarity: query.rarity,
          type: query.type,
          magic: query.magic,
        };
      }
      case "speed": {
        const query = await cardcreate(
          checkcard.name,
          checkcard.level + 1,
          TypeStatMath(checkcard.rarity, checkcard.attack),
          TypeStatMath(checkcard.rarity, checkcard.defence),
          TypeStatMath(checkcard.rarity, checkcard.speed, true),
          checkcard.imagelink,
          checkcard.description,
          checkcard.rarity,
          checkcard.type,
          TypeStatMath(checkcard.rarity, checkcard.magic)
        );
        const [updateusercard] = await runQuery<usercardinventory>(
          `UPDATE "usercardinventory" SET "id"=$2, "level"=$3 WHERE userid = $1 and cardnumber = $4 RETURNING *`,
          [checkcard.userid, query.id, query.level, checkcard.cardnumber]
        );
        return {
          id: updateusercard.id,
          userid: updateusercard.userid,
          level: updateusercard.level,
          cardnumber: cardnumber,
          isindeck: updateusercard.isindeck,
          name: query.name,
          attack: query.attack,
          defence: query.defence,
          speed: query.speed,
          imagelink: query.imagelink,
          description: query.description,
          rarity: query.rarity,
          type: query.type,
          magic: query.magic,
        };
      }
      case "magic": {
        const query = await cardcreate(
          checkcard.name,
          checkcard.level + 1,
          TypeStatMath(checkcard.rarity, checkcard.attack),
          TypeStatMath(checkcard.rarity, checkcard.defence),
          TypeStatMath(checkcard.rarity, checkcard.speed),
          checkcard.imagelink,
          checkcard.description,
          checkcard.rarity,
          checkcard.type,
          TypeStatMath(checkcard.rarity, checkcard.magic, true)
        );
        const [updateusercard] = await runQuery<usercardinventory>(
          `UPDATE "usercardinventory" SET "id"=$2, "level"=$3 WHERE userid = $1 and cardnumber = $4 RETURNING *`,
          [checkcard.userid, query.id, query.level, checkcard.cardnumber]
        );
        return {
          id: updateusercard.id,
          userid: updateusercard.userid,
          level: updateusercard.level,
          cardnumber: cardnumber,
          isindeck: updateusercard.isindeck,
          name: query.name,
          attack: query.attack,
          defence: query.defence,
          speed: query.speed,
          imagelink: query.imagelink,
          description: query.description,
          rarity: query.rarity,
          type: query.type,
          magic: query.magic,
        };
      }
    }
  } else {
    //If False We Just Edit the cards level and id.
    const [editcard] = await runQuery<usercardinventory>(
      `UPDATE "usercardinventory" SET "id"=$1,"level"="level"+1 WHERE cardnumber=$2 RETURNING *`,
      [lookforlevelabove.id, cardnumber]
    );
    //Return the abnoxious amount of values.
    return {
      id: editcard.id,
      userid: editcard.userid,
      level: editcard.level,
      cardnumber: cardnumber,
      isindeck: editcard.isindeck,
      name: lookforlevelabove.name,
      attack: lookforlevelabove.attack,
      defence: lookforlevelabove.defence,
      speed: lookforlevelabove.speed,
      imagelink: lookforlevelabove.imagelink,
      description: lookforlevelabove.description,
      rarity: lookforlevelabove.rarity,
      type: lookforlevelabove.type,
      magic: lookforlevelabove.magic,
    };
  }
}
//Random Card Fix: Start giving actual random values instead of top list of queries every time.
//Get Random Cards Based on 1-10 Rarity.
export async function randomcardsget(rarity: number): Promise<number[] | void> {
  const cards = await runQuery<globalcardlist>(
    `SELECT "id" FROM (SELECT "id" FROM globalcardlist WHERE rarity=$1 and level=1) as "cards" TABLESAMPLE bernoulli(100) ORDER BY random() LIMIT $2`,
    [rarity, 5]
  );
  if (cards.length == 0) return console.log(`Error Getting Cards on Rarity: ${rarity}`);
  return cards.map((c) => c.id!);
}
//Reset And Startup for DailyShop, users randomcardsget.
export async function dailyshopreset(): Promise<void> {
  const checkshops = await runQuery<dailyshop>(`SELECT * FROM dailyshop`);
  if (!checkshops) {
    for (let i = 1; i <= 10; i++) {
      const card = await randomcardsget(i);
      console.log(card);
      await runQuery<dailyshop>(`INSERT INTO dailyshop (cards) VALUES ($1)`, [card]);
    }
    return;
  } else {
    await runQuery<dailyshop>(`DELETE FROM dailyshop`);
    await runQuery<dailyshop>(`ALTER SEQUENCE dailyshop_luck_seq RESTART WITH 1`);
    for (let i = 1; i <= 10; i++) {
      const card = await randomcardsget(i);
      console.log(card);
      await runQuery<dailyshop>(`INSERT INTO dailyshop (cards) VALUES ($1)`, [card]);
    }
    return;
  }
}
