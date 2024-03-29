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
  fightschema,
  deckschema,
  chestinventoryschema,
  enemyEntitySchema,
  enemyuserstats,
} from "./schemas.ts";
import { init } from "./database.ts";
import { bot } from "../../cache.ts";
import { configs as conf } from "../../configs.ts";
import {
  DiscordenoMessage,
  DiscordenoMember,
  sendInteractionResponse,
  snowflakeToBigint,
  DiscordInteractionResponseTypes,
  editSlashResponse,
} from "../../deps.ts";
import { Embed } from "../utils/Embed.ts";
import { Components } from "../utils/components.ts";
import { needButton } from "../utils/collectors.ts";
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
  if (give === true) {
    await sql<GameUserSchema[]>`UPDATE "GameUserSchema" SET "xp"="xp"+${xp} WHERE id = ${user.toString()}`;
  } else {
    await sql<GameUserSchema[]>`UPDATE "GameUserSchema" SET "xp"="xp"-${xp} WHERE id = ${user.toString()}`;
  }
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
  if (check === true) {
    if (give === true) {
      await sql<
        GameUserSchema[]
      >`UPDATE "GameUserSchema" SET "statpoints" = "statpoints"+${difference}, "totalpoints" = "totalpoints"+${difference} WHERE id = ${user.toString()}`;
    } else {
      await sql<
        GameUserSchema[]
      >`UPDATE "GameUserSchema" SET "statpoints" = "statpoints"-${difference}, "totalpoints" = "totalpoints"-${difference} WHERE id = ${user.toString()}`;
    }
  }
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
  >`SELECT "id" FROM globalcardlist WHERE rarity=${rarity} and level=1 ORDER BY RANDOM() LIMIT ${numberOfCards}`;
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
      if (!card) continue;
      console.log(card);
      await sql<dailyshop[]>`INSERT INTO dailyshop (cards) VALUES (${card})`;
    }
    return;
  } else {
    await sql<dailyshop[]>`DELETE FROM dailyshop`;
    await sql<dailyshop[]>`ALTER SEQUENCE dailyshop_luck_seq RESTART WITH 1`;
    for (let i = 1; i <= 10; i++) {
      const card = await randomcardsget(i, 5);
      if (!card) continue;
      console.log(card);
      await sql<dailyshop[]>`INSERT INTO dailyshop (cards) VALUES (${card})`;
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
          card1: cardsget2?.[0]?.cardnumber || 0,
          card2: cardsget2?.[1]?.cardnumber || 0,
          card3: cardsget2?.[2]?.cardnumber || 0,
          card4: cardsget2?.[3]?.cardnumber || 0,
          card5: cardsget2?.[4]?.cardnumber || 0,
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
          card1: cardsget2?.[0]?.cardnumber || 0,
          card2: cardsget2?.[1]?.cardnumber || 0,
          card3: cardsget2?.[2]?.cardnumber || 0,
          card4: cardsget2?.[3]?.cardnumber || 0,
          card5: cardsget2?.[4]?.cardnumber || 0,
        };
      }
      case "view":
        return {
          userid: userid,
          card1: cardsget?.[0]?.cardnumber || 0,
          card2: cardsget?.[1]?.cardnumber || 0,
          card3: cardsget?.[2]?.cardnumber || 0,
          card4: cardsget?.[3]?.cardnumber || 0,
          card5: cardsget?.[4]?.cardnumber || 0,
        };
    }
  } else
    return {
      userid: userid,
      card1: cardsget?.[0]?.cardnumber || 0,
      card2: cardsget?.[1]?.cardnumber || 0,
      card3: cardsget?.[2]?.cardnumber || 0,
      card4: cardsget?.[3]?.cardnumber || 0,
      card5: cardsget?.[4]?.cardnumber || 0,
    };
}
//deno-lint-ignore no-unused-vars
function isErr(obj: deckschema | deckediterror): obj is deckediterror {
  return Reflect.has(obj, "error");
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
    const rnd = Math.random() * (max - min) + min;
    const mix = Math.random() * influence;
    const rarity = Math.floor(rnd * (1 - mix) + bias * mix);
    console.log("THE RARITY IS..." + rarity);
    const randomizedCard = await randomcardsget(rarity, 1);
    console.log(randomizedCard, rarity);
    //Delete the Chest.
    await sql<chestinventoryschema[]>`DELETE FROM "userchestinventory" WHERE chestid=${chestid}`;
    //Give the Card
    const [giveCard] = await sql<
      usercardinventory[]
    >`INSERT INTO usercardinventory (id, userid, level, isindeck) VALUES (${randomizedCard!}, ${userid.toString()}, 1, false) RETURNING *`;
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
    const rnd = Math.random() * (max - min) + min;
    const mix = Math.random() * influence;
    const rarity = Math.floor(rnd * (1 - mix) + bias * mix);
    const randomizedCard = await randomcardsget(rarity, 1);
    console.log(randomizedCard, rarity);
    //Delete the Chest.
    await sql<chestinventoryschema[]>`DELETE FROM "userchestinventory" WHERE chestid=${chestid}`;
    //Give the Card
    const [giveCard] = await sql<
      usercardinventory[]
    >`INSERT INTO usercardinventory (id, userid, level, isindeck) VALUES (${randomizedCard!}, ${userid.toString()}, 1, false) RETURNING *`;
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
//Campaign Drop Example:
export const arraytest = [
  "chest-1",
  "card-2",
  "chest-3",
  "card-4",
  "chest-5",
  "card-6",
  "chest-7",
  "card-8",
  "card-9",
  "card-10",
];
//Campaign Drops: Will Make a File With several arrays for campaign drops This is similar technique to chestdrop, only I can choose between Dropping chests or an actual card.
export async function campaigndrop(
  userid: bigint,
  array: Array<string>
): Promise<chestinventoryschema | usercardinventory> {
  //Randomization Part.
  const min = 1;
  const max = array.length;
  const bias = 1;
  const influence = 1;
  const rnd = Math.random() * (max - min) + min;
  const mix = Math.random() * influence;
  const item = Math.floor(rnd * (1 - mix) + bias * mix);
  //Outcome of Item: Then Split the type of award from ID.
  const arrayItem = array[item].split(`-`)[0];
  const arrayItemId = Number(array[item].split(`-`)[1]);
  //Figure out What type of award it is then give it to the user.
  if (arrayItem === "chest") {
    const chestgiven = await givechest(userid, arrayItemId);
    return {
      chestid: chestgiven.chestid,
      chestlevel: chestgiven.chestlevel,
      userid: userid,
    };
  } else {
    const cardgiven = await givecard(arrayItemId, userid);
    return {
      id: cardgiven.id,
      cardnumber: cardgiven.cardnumber,
      userid: cardgiven.userid,
      level: cardgiven.level,
      isindeck: cardgiven.isindeck,
    };
  }
}
//Fighting Stuff Here
//VVVVVVVVVVVVVVVVVVVV
export async function biasedcardsget(
  level = 1,
  rarity = 1,
  numberOfCards: number,
  type: "tank" | "magic" | "speed" | "attack"
): Promise<number[]> {
  const cards = await sql<
    globalcardlist[]
  >`SELECT "id" FROM globalcardlist WHERE rarity=${rarity} and level=${level} and type=${type} ORDER BY RANDOM() LIMIT ${numberOfCards}`;
  return cards.map((c) => c.id!);
}
export async function randomEnemy(level = 1): Promise<enemyEntitySchema> {
  //Get Enemy Template.
  const [enemyTemplate] = await sql<enemyuserschema[]>`SELECT * FROM enemyuserschema ORDER BY RANDOM() LIMIT 1`;
  console.log(enemyTemplate);
  const enemycards = await biasedcardsget(1, 1, 5, enemyTemplate.type);
  //Just Let every stat to make it easier and efficient for me.
  const special = Math.floor((3 * 1.9 * (2 * level)) / 3);
  const nonspecial = Math.floor((3 * 1.6 * (2 * level)) / 3);
  let health = conf.defaultstats.health;
  let basicattack = conf.defaultstats.basicattack;
  let abilitypower = conf.defaultstats.abilitypower;
  let speed = conf.defaultstats.speed;
  let defence = conf.defaultstats.defence;
  if (level < 20) {
    health = 50;
  } else {
    if (enemyTemplate.type == "tank") {
      health = special;
    } else health = nonspecial;
  }
  switch (enemyTemplate.type) {
    case "tank":
      basicattack = nonspecial;
      abilitypower = 0;
      speed = nonspecial;
      defence = special;
      break;
    case "attack":
      basicattack = special;
      abilitypower = 0;
      speed = nonspecial;
      defence = nonspecial;
      break;
    case "speed":
      basicattack = special;
      abilitypower = 0;
      speed = special;
      defence = 0;
      break;
    case "magic":
      basicattack = 0;
      abilitypower = nonspecial;
      speed = nonspecial;
      defence = 0;
      break;
  }
  return {
    enemyTemplate: enemyTemplate,
    level: level,
    enemyHealth: health,
    enemystats: {
      health: health,
      basicattack: basicattack,
      abilitypower: abilitypower,
      speed: speed,
      defence: defence,
    },
    enemycards: enemycards,
  };
}
//Auto-Scaling Random Enemy Based off Dungeon Level needed for FightCache.
//Auto-Import User Health Stat for FightCache.
export async function initiateDungeon(userid: bigint, newSession = true): Promise<fightschema | undefined | void> {
  //IF the session is continuing to a new level, set newSession to False,
  if (newSession === false) {
    const oldSession = bot.fightCache.get(userid);
    const newEnemy = await randomEnemy(oldSession!.level + 1);
    //Create a New Enemy Based on the new level
    bot.fightCache.set(userid, {
      level: oldSession!.level + 1,
      userhealth: oldSession!.userhealth,
      usercards: oldSession!.usercards,
      userstats: oldSession!.userstats,
      enemyuser: newEnemy,
      enemyhealth: newEnemy.enemyHealth,
      enemycards: newEnemy.enemycards,
    });
    return {
      level: oldSession!.level + 1,
      userhealth: oldSession!.userhealth,
      usercards: oldSession!.usercards,
      userstats: oldSession!.userstats,
      enemyuser: newEnemy,
      enemyhealth: newEnemy.enemyHealth,
      enemycards: newEnemy.enemycards,
    }; //SetValuesHere
  } else {
    //If it is a new session, make one.
    //Create the enemy for the session with the level 1 stat.
    const newEnemy = await randomEnemy(1);
    //View the User Deck to grab the userdeck Promise.
    const deckView = await DeckViewEdit(userid, "view");
    //If the DeckView throws an error, return.
    if ("error" in deckView) return console.log("error in DeckView:" + deckView.error);
    //Make the array in the order of the cards.
    const cardArray = [deckView.card1, deckView.card2, deckView.card3, deckView.card4, deckView.card5];
    //Use statdata function to get the health stat of the user.
    const userhealthstat = await statdata(userid);
    const userstats = {
      health: userhealthstat.health!,
      basicattack: userhealthstat.basicattack!,
      abilitypower: userhealthstat.abilitypower!,
      speed: userhealthstat.speed!,
      defence: userhealthstat.defense!,
    };
    //if the healthstat doesn't "exist" return.
    if (!userhealthstat.health) return;
    //Make a set with the stats gathered and enemy created.
    bot.fightCache.set(userid, {
      level: 1,
      usercards: cardArray,
      userhealth: userhealthstat?.health,
      userstats: userstats,
      enemyuser: newEnemy,
      enemyhealth: newEnemy.enemyHealth,
      enemycards: newEnemy.enemycards,
    });
    return {
      level: 1,
      usercards: cardArray,
      userhealth: userhealthstat?.health,
      userstats: userstats,
      enemyuser: newEnemy,
      enemyhealth: newEnemy.enemyHealth,
      enemycards: newEnemy.enemycards,
    }; //SetValuesHere
  }
}
export function randomCardFromDeck(deck: Array<number>): number {
  const randomCard = deck[~~(deck.length * Math.random())];
  return randomCard;
}
interface fightCardStats extends Record<string, unknown> {
  attack: number;
  defence: number;
  speed: number;
  ability: number;
}
export function COMBINESTATSWITHCARD(entity: enemyuserstats, cardData: globalcardlist): fightCardStats {
  const attack = entity.basicattack + cardData.attack;
  const defence = entity.defence + cardData.defence;
  const speed = entity.speed + cardData.speed;
  const ability = entity.abilitypower + cardData.magic;
  return { attack: attack, defence: defence, speed: speed, ability: ability };
}
export async function createNewSession(
  //Users Object.
  UserObject: DiscordenoMember,
  //Message of the User.
  message: DiscordenoMessage,
  //Starting Embed.
  StartingEmbed: Embed,
  //IF the user has an unfinished Session, send this.
  OldSessionDisplay: {
    unfinishedFightEmbed: Embed;
    unfinishedEmbedButtons: Components;
  },
  //Fighting Embed, Has to be a Function since fight stats will always change.
  FightDisplay: {
    FlexibleFightEmbed: (
      userhealth: number,
      enemyhealth: number,
      user: enemyuserstats,
      enemy: enemyEntitySchema,
      start: boolean,
      lastusercardused?: string,
      lastenemycardused?: string
    ) => Embed;
    autoCardButtons: (cards: Array<number>) => Promise<Components>;
  },
  //If User Wins, Send this.
  WinnerDisplay: {
    YouWonEmbed: (level: number, enemy: enemyEntitySchema, chestlevel: number) => Embed;
    WinnerButtons: Components;
  },
  LoserDisplay: {
    YouLostEmbed: (level: number, enemy: enemyEntitySchema) => Embed;
    LoserButton: Components;
  },
  GoingUp = false
): Promise<void | undefined | DiscordenoMessage> {
  //If they're in the system, good, lets send them the "Loading" message, this will also be the main message we will always edit.
  const MAINMESSAGE = await message.reply({ embeds: [StartingEmbed] });
  //IF GOING UP A DUNGEON LEVEL, BYPASS ALL CHECKING, AND MAKE A SESSION:
  if (GoingUp === true) {
    let fightschema = await initiateDungeon(UserObject.id, false);
    //Now that we created or got the session, first we should get all fightschema values into seperate constants/let variables.
    //User Values:
    let userhealth = fightschema!.userstats.health; //This Value will Change
    let lastcardused = "not defined yet"; //This Value will Change
    const userstats = fightschema!.userstats; //These stats will neverchange.
    //Enemy Values:
    let enemyhealth = fightschema!.enemyuser.enemystats.health; //This Value will change
    let lastcardenemyused = "not defined yet"; //This Value will change
    const enemyEntitySchema = fightschema!.enemyuser; //These stats will never change.
    const enemystats = fightschema!.enemyuser.enemystats; //These stats will never change.

    //Now we stated the values we needed before the loop, we can now just edit embed to fightembed + buttons.
    await MAINMESSAGE.edit({
      embeds: [FightDisplay.FlexibleFightEmbed(userhealth, enemyhealth, userstats, enemyEntitySchema, true)],
      components: await FightDisplay.autoCardButtons(fightschema!.usercards),
    });

    //Start Fight loop.
    //We need default timeout value to be false.
    let timeout = false;
    //We need the bot to know the game is finished or not.
    let gamefinished = false;
    //By default the winner is the user.
    let winner = "user";
    //Move barely plays a part but is needed for timeout.
    let move = 0;

    //HEART OF THE MECHANICS HERE

    //VVVVVVVVVVVVVVVVVVVVVVVVVVV

    while (userhealth > 0 && enemyhealth > 0) {
      //The loop does not go on until the button is pressed.
      const buttonPress = await needButton(UserObject.id, MAINMESSAGE.id).catch(() => undefined);
      if (!buttonPress) {
        timeout = true;
        break;
      } else {
        move = move + 1;
        console.log(move);
        //Find what card the user selected
        const [usercard] = await sql<
          (usercardinventory & globalcardlist)[]
        >`SELECT * FROM "usercardinventory" INNER JOIN "globalcardlist" ON "globalcardlist"."id"="usercardinventory"."id" WHERE cardnumber = ${Number(
          buttonPress.customId
        )}`;
        //State the name and level for the embed.
        lastcardused = `${usercard.name} LVL: ${usercard.level}`;
        //Get a random card from the enemy,
        let enemycardselected = randomCardFromDeck(enemyEntitySchema.enemycards);
        let enemycard = await searchcard(enemycardselected);
        //State the name and level for the embed.
        lastcardenemyused = `${enemycard.name}, LVL: ${enemycard.level}`;
        //Now We combine the stats and do the fight.
        let combineStatsUser = COMBINESTATSWITHCARD(userstats, usercard);
        let combineStatsEnemy = COMBINESTATSWITHCARD(enemyEntitySchema.enemystats, enemycard);

        //VVVV FIGHT STARTS VVVVVV

        //IF THE USER IS FASTER THAN THE ENEMY, LET THE USER HIT THE ENEMY FIRST.
        if (combineStatsUser.speed > combineStatsEnemy.speed) {
          enemyhealth =
            enemyhealth -
            (combineStatsUser.attack - combineStatsEnemy.defence) -
            (combineStatsUser.ability - combineStatsEnemy.defence / 2);
          if (!(enemyhealth > 0)) {
            gamefinished = true;
            winner = "user";
            break;
          }
          userhealth =
            userhealth -
            (combineStatsEnemy.attack - combineStatsUser.defence) -
            (combineStatsEnemy.ability - combineStatsUser.defence / 2);
          if (!(userhealth > 0)) {
            gamefinished = true;
            winner = "enemy";
            break;
          }
          await editSlashResponse(buttonPress.interaction.token, {
            embeds: [
              FightDisplay.FlexibleFightEmbed(
                userhealth,
                enemyhealth,
                userstats,
                enemyEntitySchema,
                false,
                lastcardused,
                lastcardenemyused
              ),
            ],
          });
          continue;
        } else {
          userhealth =
            userhealth -
            (combineStatsEnemy.attack - combineStatsUser.defence) -
            (combineStatsEnemy.ability - combineStatsUser.defence / 2);
          if (!(userhealth > 0)) {
            gamefinished = true;
            winner = "enemy";
            break;
          }
          enemyhealth =
            enemyhealth -
            (combineStatsUser.attack - combineStatsEnemy.defence) -
            (combineStatsUser.ability - combineStatsEnemy.defence / 2);
          if (!(enemyhealth > 0)) {
            gamefinished = true;
            winner = "user";
            break;
          }
          fightschema!.userhealth = userhealth;
          fightschema!.enemyhealth = enemyhealth;
          await editSlashResponse(buttonPress.interaction.token, {
            embeds: [
              FightDisplay.FlexibleFightEmbed(
                userhealth,
                enemyhealth,
                userstats,
                enemyEntitySchema,
                false,
                lastcardused,
                lastcardenemyused
              ),
            ],
          });
          continue;
        }
      }
    }

    //Ending Of Function Here.

    //VVVVVVVVVVVVVVVVVVVVVVVV

    if (timeout === true) {
      //timeout Reaction here.
      //If move is 0, the game did not start, else cache it.
      if (move > 0 || GoingUp === true) {
        const test = bot.unfinishedFightsCache.set(UserObject.id, fightschema!);
        console.log(`Cached?:`, test);
        await MAINMESSAGE.edit({
          embeds: [],
          content: `${UserObject.mention}, We saw that you timed out, so we cached your dungeon session, to continue playing, use the dungeon command again!`,
        });
      } else {
        await MAINMESSAGE.edit({
          embeds: [],
          content: `${UserObject.mention}, We saw that you timed out, but you did not make a move, create a new session by using the dungeon command again!`,
        });
        return;
      }
    }
    //The Session/Level finished, here is where we react and finish the function.
    if (gamefinished === true) {
      if (winner === "user") {
        //Winner Reaction here.
        const chestlevel = Math.floor(fightschema!.level * 0.05);
        await MAINMESSAGE.edit({
          embeds: [WinnerDisplay.YouWonEmbed(fightschema!.level, enemyEntitySchema, chestlevel)],
          components: WinnerDisplay.WinnerButtons,
        });
        const continuesessionbutton = await needButton(UserObject.id, MAINMESSAGE.id).catch(() => undefined);
        if (!continuesessionbutton || continuesessionbutton.customId === "end") {
          //End Session, Give awards and delete components. return;
          await givechest(UserObject.id, chestlevel);
          await xpchange(UserObject.id, fightschema!.level * 20);
          await sql`UPDATE "GameUserSchema" SET "money"="money"+${
            fightschema!.level * 10
          } WHERE id = ${UserObject.id.toString()}`;
          return;
        } else {
          if (continuesessionbutton.customId === `continue`) {
            await createNewSession(
              UserObject,
              message,
              StartingEmbed,
              OldSessionDisplay,
              FightDisplay,
              WinnerDisplay,
              LoserDisplay,
              true
            );
            return;
          } else {
            bot.unfinishedFightsCache.set(UserObject.id, fightschema!);
          }
          return;
        }
      } else {
        //Loser Reaction here.
        //User only gets half rewards, reward it from now.
        await xpchange(UserObject.id, fightschema!.level * 10, true);
        await sql`UPDATE "GameUserSchema" SET "money"="money"+${
          fightschema!.level * 5
        } WHERE id= ${UserObject.id.toString()}`;
        await MAINMESSAGE.edit({
          embeds: [LoserDisplay.YouLostEmbed(fightschema!.level, enemyEntitySchema)],
          components: LoserDisplay.LoserButton,
        });
        const newsessionbutton = await needButton(UserObject.id, MAINMESSAGE.id).catch(() => undefined);
        if (newsessionbutton!.customId === "new") {
          await createNewSession(
            UserObject,
            message,
            StartingEmbed,
            OldSessionDisplay,
            FightDisplay,
            WinnerDisplay,
            LoserDisplay
          );
          return;
        } else {
          return;
        }
      }
    }
  }
  //Check If their DATA exists in the system, or else the bot crashes when running the database functions.
  const datacheck = await gamedatacheck(UserObject.id);
  if (!datacheck)
    return await MAINMESSAGE.edit(`Hey, seems like you're new, to get started, use the !tradingstart command!`);

  //As a DEFAULT:
  //We're Always creating a new Session.
  let newSession = true;
  let fightschema = {} as fightschema;
  let sessionlevel = 1;

  //Now, Lets Check If the user has an old Session.
  if (bot.unfinishedFightsCache.has(UserObject.id)) {
    //IF they do have an old session, lets prompt the user and ask them if they want to continue from where they left off.
    //First We Edit the MAINMESSAGE of the function.
    await MAINMESSAGE.edit({
      embeds: [OldSessionDisplay.unfinishedFightEmbed],
      components: OldSessionDisplay.unfinishedEmbedButtons,
    });
    //Now We get the needButton.
    const prompt = await needButton(UserObject.id, MAINMESSAGE.id).catch(() => undefined);
    if (prompt!.customId) {
      //if Button Pressed is "yes", just say it is no longer a newsession.
      if (prompt!.customId == "yes") {
        newSession = false;
      } else {
        //IF Button Pressed is "no", then keep saying its a newsession, but also delete oldsession cache.
        bot.unfinishedFightsCache.delete(UserObject.id);
        newSession = true;
      }
    } else {
      //If no Button is Pressed:
      await MAINMESSAGE.edit(`Game Session Timed Out.`);
      return;
    }
  }
  //Now We're done doing the "Checks" lets start creating the sessionSchema.

  //If it is a NewSession we are creating, use initiateDungeon Function
  if (newSession) {
    //Initiate Dungeon
    const dungeon = await initiateDungeon(UserObject.id, true);
    if (!dungeon) {
      return console.log(`FUCKED SESSION:` + UserObject);
    }
    //Then we use let to abuse global dumb stuff.
    fightschema = dungeon;
  } else {
    //IF IT ISNT A NEW SESSION, get Fightschema from oldSession:
    const dungeon = bot.unfinishedFightsCache.get(UserObject.id);
    if (!dungeon) {
      return console.log(`FUCKED SESSION:` + UserObject);
    }
    //Then we use let to abuse global dumb stuff.
    fightschema = dungeon;
  }

  //Now that we created or got the session, first we should get all fightschema values into seperate constants/let variables.
  //User Values:
  let userhealth = fightschema!.userstats.health; //This Value will Change
  let lastcardused = "not defined yet"; //This Value will Change
  const userstats = fightschema!.userstats; //These stats will neverchange.
  //Enemy Values:
  let enemyhealth = fightschema!.enemyuser.enemystats.health; //This Value will change
  let lastcardenemyused = "not defined yet"; //This Value will change
  const enemyEntitySchema = fightschema!.enemyuser; //These stats will never change.
  const enemystats = fightschema!.enemyuser.enemystats; //These stats will never change.

  //Now we stated the values we needed before the loop, we can now just edit embed to fightembed + buttons.
  await MAINMESSAGE.edit({
    embeds: [FightDisplay.FlexibleFightEmbed(userhealth, enemyhealth, userstats, enemyEntitySchema, true)],
    components: await FightDisplay.autoCardButtons(fightschema!.usercards),
  });

  //Start Fight loop.
  //We need default timeout value to be false.
  let timeout = false;
  //We need the bot to know the game is finished or not.
  let gamefinished = false;
  //By default the winner is the user.
  let winner = "user";
  //Move barely plays a part but is needed for timeout.
  let move = 0;

  //HEART OF THE MECHANICS HERE

  //VVVVVVVVVVVVVVVVVVVVVVVVVVV

  while (userhealth > 0 && enemyhealth > 0) {
    //The loop does not go on until the button is pressed.
    const buttonPress = await needButton(UserObject.id, MAINMESSAGE.id).catch(() => undefined);
    if (!buttonPress) {
      timeout = true;
      break;
    } else {
      move = move + 1;
      console.log(move);
      //Find what card the user selected
      const [usercard] = await sql<
        (usercardinventory & globalcardlist)[]
      >`SELECT * FROM "usercardinventory" INNER JOIN "globalcardlist" ON "globalcardlist"."id"="usercardinventory"."id" WHERE cardnumber = ${Number(
        buttonPress.customId
      )}`;
      //State the name and level for the embed.
      lastcardused = `${usercard.name} LVL: ${usercard.level}`;
      //Get a random card from the enemy,
      let enemycardselected = randomCardFromDeck(enemyEntitySchema.enemycards);
      let enemycard = await searchcard(enemycardselected);
      //State the name and level for the embed.
      lastcardenemyused = `${enemycard.name}, LVL: ${enemycard.level}`;
      //Now We combine the stats and do the fight.
      let combineStatsUser = COMBINESTATSWITHCARD(userstats, usercard);
      let combineStatsEnemy = COMBINESTATSWITHCARD(enemyEntitySchema.enemystats, enemycard);

      //VVVV FIGHT STARTS VVVVVV

      //IF THE USER IS FASTER THAN THE ENEMY, LET THE USER HIT THE ENEMY FIRST.
      if (combineStatsUser.speed > combineStatsEnemy.speed) {
        enemyhealth =
          enemyhealth -
          (combineStatsUser.attack - combineStatsEnemy.defence) -
          (combineStatsUser.ability - combineStatsEnemy.defence / 2);
        if (!(enemyhealth > 0)) {
          gamefinished = true;
          winner = "user";
          break;
        }
        userhealth =
          userhealth -
          (combineStatsEnemy.attack - combineStatsUser.defence) -
          (combineStatsEnemy.ability - combineStatsUser.defence / 2);
        if (!(userhealth > 0)) {
          gamefinished = true;
          winner = "enemy";
          break;
        }
        await editSlashResponse(buttonPress.interaction.token, {
          embeds: [
            FightDisplay.FlexibleFightEmbed(
              userhealth,
              enemyhealth,
              userstats,
              enemyEntitySchema,
              false,
              lastcardused,
              lastcardenemyused
            ),
          ],
        });
        continue;
      } else {
        userhealth =
          userhealth -
          (combineStatsEnemy.attack - combineStatsUser.defence) -
          (combineStatsEnemy.ability - combineStatsUser.defence / 2);
        if (!(userhealth > 0)) {
          gamefinished = true;
          winner = "enemy";
          break;
        }
        enemyhealth =
          enemyhealth -
          (combineStatsUser.attack - combineStatsEnemy.defence) -
          (combineStatsUser.ability - combineStatsEnemy.defence / 2);
        if (!(enemyhealth > 0)) {
          gamefinished = true;
          winner = "user";
          break;
        }
        fightschema.userhealth = userhealth;
        fightschema.enemyhealth = enemyhealth;
        await editSlashResponse(buttonPress.interaction.token, {
          embeds: [
            FightDisplay.FlexibleFightEmbed(
              userhealth,
              enemyhealth,
              userstats,
              enemyEntitySchema,
              false,
              lastcardused,
              lastcardenemyused
            ),
          ],
        });
        continue;
      }
    }
  }

  //Ending Of Function Here.

  //VVVVVVVVVVVVVVVVVVVVVVVV

  if (timeout === true) {
    //timeout Reaction here.
    //If move is 0, the game did not start, else cache it.
    if (move > 0) {
      const test = bot.unfinishedFightsCache.set(UserObject.id, fightschema!);
      console.log(`Cached?:`, test);
      await MAINMESSAGE.edit({
        embeds: [],
        content: `${UserObject.mention}, We saw that you timed out, so we cached your dungeon session, to continue playing, use the dungeon command again!`,
      });
    } else {
      await MAINMESSAGE.edit({
        embeds: [],
        content: `${UserObject.mention}, We saw that you timed out, but you did not make a move, create a new session by using the dungeon command again!`,
      });
      return;
    }
  }
  //The Session/Level finished, here is where we react and finish the function.
  if (gamefinished === true) {
    if (winner === "user") {
      //Winner Reaction here.
      const chestlevel = Math.floor(fightschema!.level * 0.05);
      await MAINMESSAGE.edit({
        embeds: [WinnerDisplay.YouWonEmbed(fightschema!.level, enemyEntitySchema, chestlevel)],
        components: WinnerDisplay.WinnerButtons,
      });
      const continuesessionbutton = await needButton(UserObject.id, MAINMESSAGE.id).catch(() => undefined);
      if (!continuesessionbutton || continuesessionbutton.customId === "end") {
        //End Session, Give awards and delete components. return;
        await givechest(UserObject.id, chestlevel);
        await xpchange(UserObject.id, fightschema!.level * 20);
        await sql`UPDATE "GameUserSchema" SET "money"="money"+${
          fightschema!.level * 10
        } WHERE id = ${UserObject.id.toString()}`;
        return;
      } else {
        if (continuesessionbutton.customId === `continue`) {
          await createNewSession(
            UserObject,
            message,
            StartingEmbed,
            OldSessionDisplay,
            FightDisplay,
            WinnerDisplay,
            LoserDisplay,
            true
          );
          return;
        } else {
          bot.unfinishedFightsCache.set(UserObject.id, fightschema!);
        }
        return;
      }
    } else {
      //Loser Reaction here.
      //User only gets half rewards, reward it from now.
      await xpchange(UserObject.id, fightschema!.level * 10, true);
      await sql`UPDATE "GameUserSchema" SET "money"="money"+${
        fightschema!.level * 5
      } WHERE id= ${UserObject.id.toString()}`;
      await MAINMESSAGE.edit({
        embeds: [LoserDisplay.YouLostEmbed(fightschema!.level, enemyEntitySchema)],
        components: LoserDisplay.LoserButton,
      });
      const newsessionbutton = await needButton(UserObject.id, MAINMESSAGE.id).catch(() => undefined);
      if (newsessionbutton!.customId === "new") {
        await createNewSession(
          UserObject,
          message,
          StartingEmbed,
          OldSessionDisplay,
          FightDisplay,
          WinnerDisplay,
          LoserDisplay
        );
        return;
      } else {
        return;
      }
    }
  }
}
