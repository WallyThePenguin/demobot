import { postgres } from "./../../deps.ts";
const host = "localhost";
const username = "postgres";
const password = "waleed12";
const database = "postgres";
const port = 5432;
export const sql = postgres({
  hostname: host,
  username: username,
  password: password,
  database: database,
  port: port,
  types: {
    bigint: postgres.BigInt,
  },
  max: 25,
});
import {
  GameUserSchema,
  globalcardlist,
  enemyuserschema,
  usercardinventory,
  dailyshop,
  fightschema as _fightschema,
  deckschema,
  chestinventoryschema,
} from "./schemas.ts";
import { init } from "./database.ts";
await init();

//**Check if data exists */
export async function gamedatacheck(user: bigint): Promise<boolean> {
  const check = await sql<GameUserSchema[]>`SELECT 1 FROM "GameUserSchema" WHERE id = ${user.toString()} LIMIT 1`;
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
  const [userdata] = await sql<
    GameUserSchema[]
  >`SELECT money, health, basicattack, abilitypower, speed, luck, chance, critchance, critdmgmultiplier, defense, xp FROM "GameUserSchema" WHERE id = ${user.toString()} LIMIT 1`;
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
  const xpamount = await sql<GameUserSchema[]>`SELECT xp FROM "GameUserSchema" WHERE id = ${user.toString()}`;
  //**Simple Reciprocal formula to get userlevel for xp. */
  const userlevel = Math.floor(xpamount[0].xp ** (5 / 9) - 10);
  return { xp: xpamount[0].xp, level: userlevel };
}

//Give or Take xp of a user
export async function xpchange(user: bigint, xp: number, give = true): Promise<xplevel> {
  //**Checklevel Before being affected */
  const oldamount = await checklevel(user);
  //**Update the xp value to either take or gain xp */
  await sql<GameUserSchema[]>`UPDATE "GameUserSchema" SET "xp" = "xp" ${
    give ? "+" : "-"
  } ${xp} WHERE id = ${user.toString()}`;
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
    sql<GameUserSchema[]>`UPDATE "GameUserSchema" SET "statpoints" = "statpoints" ${
      give ? "+" : "-"
    } ${difference}, "totalpoints" = "totalpoints" ${give ? "+" : "-"} ${difference} WHERE id = ${user.toString()}`;
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
  const [newcard] = await sql<
    globalcardlist[]
  >`INSERT INTO globalcardlist (name, level, attack, defence, speed, imagelink, description, rarity, type, magic) VALUES (${name}, ${level}, ${attack}, ${defence}, ${speed}, ${imagelink}, ${description}, ${rarity}, ${type}, ${magic}) RETURNING *`;
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
  const [newenemy] = await sql<
    enemyuserschema[]
  >`INSERT INTO enemyuserschema (name, image, type, description) VALUES (${name}, ${image}, ${type}, ${description}) RETURNING *`;
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
  const [givecard] = await sql<
    usercardinventory[]
  >`INSERT INTO usercardinventory (id, userid, level, isindeck) VALUES (${cardid}, ${user.toString()}, ${level}, ${isindeck}) RETURNING *`;
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
  const [findcard] = await sql<globalcardlist[]>`SELECT * FROM "globalcardlist" WHERE id = ${id}`;
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
//Auto Card Scaling.
//VVVVVVVVVVVVVVVVV
//Scale Card To Level
export async function autocardscale(
  //Try for card number
  cardnumber: number
): Promise<(globalcardlist & usercardinventory) | undefined> {
  //Look For Cards Name And Cards
  const [checkcard] = await sql<
    usercardinventory[] & globalcardlist[]
  >`SELECT * FROM "usercardinventory" INNER JOIN "globalcardlist" ON "globalcardlist"."id"="usercardinventory"."id" WHERE cardnumber = ${cardnumber}`;
  //Look For The Card By Name And Level
  const [lookforlevelabove] = await sql<
    globalcardlist[]
  >`SELECT * FROM "globalcardlist" WHERE name = ${checkcard.name} and level = ${checkcard.level}+1`;

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
        const [updateusercard] = await sql<
          usercardinventory[]
        >`UPDATE "usercardinventory" SET "id"=${query?.id!}, "level"=${query.level!} WHERE userid = ${checkcard.userid.toString()} and cardnumber = ${
          checkcard.cardnumber
        } RETURNING *`;
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
        const [updateusercard] = await sql<
          usercardinventory[]
        >`UPDATE "usercardinventory" SET "id"=${query?.id!}, "level"=${query.level!} WHERE userid = ${checkcard.userid.toString()} and cardnumber = ${
          checkcard.cardnumber
        } RETURNING *`;
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
        const [updateusercard] = await sql<
          usercardinventory[]
        >`UPDATE "usercardinventory" SET "id"=${query?.id!}, "level"=${query.level!} WHERE userid = ${checkcard.userid.toString()} and cardnumber = ${
          checkcard.cardnumber
        } RETURNING *`;
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
        const [updateusercard] = await sql<
          usercardinventory[]
        >`UPDATE "usercardinventory" SET "id"=${query?.id!}, "level"=${query.level!} WHERE userid = ${checkcard.userid.toString()} and cardnumber = ${
          checkcard.cardnumber
        } RETURNING *`;
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
    const [editcard] = await sql<
      usercardinventory[]
    >`UPDATE "usercardinventory" SET "id"=${lookforlevelabove.id!},"level"="level"+1 WHERE cardnumber=${cardnumber} RETURNING *`;
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
//Make Sure the Bernoulli is not 100% on public release.
export async function randomcardsget(rarity: number, numberOfCards: number): Promise<number[] | void> {
  const cards = await sql<
    globalcardlist[]
  >`SELECT "id" FROM globalcardlist WHERE rarity=${rarity} and level=1 TABLESAMPLE bernoulli(100) ORDER BY random() LIMIT ${numberOfCards}`;
  console.log(cards);
  if (cards.length == 0) return console.log(`Error Getting Cards on Rarity: ${rarity}`);
  return cards.map((c) => c.id!);
}
//Reset And Startup for DailyShop, users randomcardsget.
export async function dailyshopreset(): Promise<void> {
  const checkshops = await sql<dailyshop[]>`SELECT * FROM dailyshop`;
  if (!checkshops) {
    for (let i = 1; i <= 10; i++) {
      const card = await randomcardsget(i, 5);
      console.log(card);
      await sql<dailyshop[]>`INSERT INTO dailyshop (cards) VALUES (${card!})`;
    }
    return;
  } else {
    await sql<dailyshop[]>`DELETE FROM dailyshop`;
    await sql<dailyshop[]>`ALTER SEQUENCE dailyshop_luck_seq RESTART WITH 1`;
    for (let i = 1; i <= 10; i++) {
      const card = await randomcardsget(i, 5);
      console.log(card);
      await sql<dailyshop[]>`INSERT INTO dailyshop (cards) VALUES (${card!})`;
    }
    return;
  }
}
//Deck Editing
//VVVVVVVVVVVV
export interface deckediterror extends Record<string, unknown> {
  //**If Error is 1: "No Cardnumber listed under this id." */
  //**If Error is 2: "Too many cards in the deck to add another card." */
  //**If Error is 3: "No Card To Remove. (Empty Deck)" */
  error: 1 | 2 | 3;
}
export async function DeckViewEdit(
  userid: bigint,
  type?: "add" | "remove" | "view",
  cardnumber?: number
): Promise<deckschema | deckediterror> {
  const cardsget = await sql<
    usercardinventory[]
  >`SELECT * FROM usercardinventory WHERE userid=${userid.toString()} and isindeck=true`;
  console.log(cardsget);
  if (type !== undefined && cardnumber !== undefined) {
    switch (type) {
      case "add": {
        if (cardsget.length + 1 > 5) return { error: 2 };
        console.log("Add Ran.");
        const deckupdate = await sql<
          usercardinventory[]
        >`UPDATE "usercardinventory" SET isindeck=true WHERE userid=${userid.toString()} and cardnumber=${cardnumber} RETURNING *`;
        const cardsget2 = await sql<
          usercardinventory[]
        >`SELECT * FROM usercardinventory WHERE userid=${userid.toString()} and isindeck=true`;
        if (deckupdate.length === 0) return { error: 1 };
        return {
          userid: userid,
          card1: cardsget2?.[0]?.cardnumber || null,
          card2: cardsget2?.[1]?.cardnumber || null,
          card3: cardsget2?.[2]?.cardnumber || null,
          card4: cardsget2?.[3]?.cardnumber || null,
          card5: cardsget2?.[4]?.cardnumber || null,
        };
      }
      case "remove": {
        if (cardsget.length === 0) return { error: 3 };
        const deckupdate = await sql<
          usercardinventory[]
        >`UPDATE "usercardinventory" SET isindeck=false WHERE userid=${userid.toString()} and cardnumber=${cardnumber} RETURNING *`;
        if (deckupdate.length === 0) return { error: 1 };
        const cardsget2 = await sql<
          usercardinventory[]
        >`SELECT * FROM usercardinventory WHERE userid=${userid.toString()} and isindeck=true`;
        if (deckupdate.length === 0) return { error: 1 };
        return {
          userid: userid,
          card1: cardsget2?.[0]?.cardnumber || null,
          card2: cardsget2?.[1]?.cardnumber || null,
          card3: cardsget2?.[2]?.cardnumber || null,
          card4: cardsget2?.[3]?.cardnumber || null,
          card5: cardsget2?.[4]?.cardnumber || null,
        };
      }
      case "view":
        return {
          userid: userid,
          card1: cardsget?.[0]?.cardnumber || null,
          card2: cardsget?.[1]?.cardnumber || null,
          card3: cardsget?.[2]?.cardnumber || null,
          card4: cardsget?.[3]?.cardnumber || null,
          card5: cardsget?.[4]?.cardnumber || null,
        };
    }
  } else
    return {
      userid: userid,
      card1: cardsget?.[0]?.cardnumber || null,
      card2: cardsget?.[1]?.cardnumber || null,
      card3: cardsget?.[2]?.cardnumber || null,
      card4: cardsget?.[3]?.cardnumber || null,
      card5: cardsget?.[4]?.cardnumber || null,
    };
}
//Chest Based-Functions Here.
//VVVVVVVVVVVVVVVVVVVVVVVVVV

//Give a User a Chest.
export async function givechest(userid: bigint, chestlevel: number): Promise<chestinventoryschema> {
  const [chest] = await sql<
    chestinventoryschema[]
  >`INSERT INTO userchestinventory (userid, chestlevel) VALUES (${userid.toString()},${chestlevel}) RETURNING *`;
  return {
    chestid: chest.chestid,
    chestlevel: chest.chestlevel,
    userid: userid,
  };
}
//How Chests Drops Work:
// Type of Chest  || Level of Card Drops.
//Common (level 1): level 1, rarely level 2, 3 very rare
//Uncommon (level 2): Level 2, Rarely Level 3, 4 very rare
//Rare (level 3): Level 3, Rarely Level 4, level 5 very rare
//So far so forth you know how it works.
//Until Levels 8, 9, 10, they are all mixed in chest 7, making it harder to scale.

//Card Drops From Chest
export async function chestdrop(chestid: number, userid: bigint): Promise<usercardinventory> {
  const [getChest] = await sql<chestinventoryschema[]>`SELECT * FROM userchestinventory WHERE chestid = ${chestid}`;
  //Card Drop Randomization
  //Choose the Rarity Of what drops from the Chest.
  if (7 > getChest.chestlevel) {
    const min = getChest.chestlevel;
    const max = getChest.chestlevel + 2;
    const bias = getChest.chestlevel;
    const influence = 1;
    const rnd = Math.round(Math.random()) * (max - min) + min;
    const mix = Math.round(Math.random()) * influence;
    const rarity = rnd * (1 - mix) + bias * mix;
    console.log("THE RARITY IS..." + rarity);
    const randomizedCard = await randomcardsget(rarity, 1);
    console.log(randomizedCard, rarity);
    //Delete the Chest.
    await sql<chestinventoryschema[]>`DELETE FROM "userchestinventory" WHERE chestid=${chestid}`;
    //Give the Card
    const [giveCard] = await sql<
      usercardinventory[]
    >`INSERT INTO usercardinventory (id, userid, level, isindeck) VALUES (${!randomizedCard}, ${userid.toString()}, 1, false) RETURNING *`;
    //Return Card Values
    return {
      id: giveCard.id,
      isindeck: giveCard.isindeck,
      userid: giveCard.userid,
      level: giveCard.level,
      cardnumber: giveCard.cardnumber,
    };
  } else {
    const min = 7;
    const max = 10;
    const bias = 7;
    const influence = 1;
    const rnd = Math.round(Math.random()) * (max - min) + min;
    const mix = Math.round(Math.random()) * influence;
    const rarity = rnd * (1 - mix) + bias * mix;
    const randomizedCard = await randomcardsget(rarity, 1);
    console.log(randomizedCard, rarity);
    //Delete the Chest.
    await sql<chestinventoryschema[]>`DELETE FROM "userchestinventory" WHERE chestid=${chestid}`;
    //Give the Card
    const [giveCard] = await sql<
      usercardinventory[]
    >`INSERT INTO usercardinventory (id, userid, level, isindeck) VALUES (${!randomizedCard}, ${userid.toString()}, 1, false) RETURNING *`;
    //Return Card Values
    return {
      id: giveCard.id,
      isindeck: giveCard.isindeck,
      userid: giveCard.userid,
      level: giveCard.level,
      cardnumber: giveCard.cardnumber,
    };
    //Card Creation.
  }
}
