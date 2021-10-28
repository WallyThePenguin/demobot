import {
  cache,
  addRole,
  MessageReactionAdd,
  DiscordenoMessage,
  bigintToSnowflake,
  snowflakeToBigint,
} from "../../deps.ts";
import { bot } from "../../cache.ts";
import { processReactionCollectors } from "../utils/collectors.ts";
import { messages } from "./message_create.ts";
import { sql } from "../database/client.ts";
import { VoteSchema, GuildSchema } from "../database/schemas.ts";
// deno-lint-ignore require-await
bot.eventHandlers.reactionAdd = async function (data, message) {
  //Process Reaction Collectors.
  if (message) {
    pollsReaction(message, data);
    rulesReaction(message, data);
    processReactionCollectors(message, data.emoji, snowflakeToBigint(data.userId));
  }
};

async function pollsReaction(message: DiscordenoMessage, data: MessageReactionAdd) {
  const num = [
    "\u0030\u20E3",
    "\u0031\u20E3",
    "\u0032\u20E3",
    "\u0033\u20E3",
    "\u0034\u20E3",
    "\u0035\u20E3",
    "\u0036\u20E3",
    "\u0037\u20E3",
    "\u0038\u20E3",
    "\u0039\u20E3",
  ];
  //See If the Message Being Reacted to is cached,
  const messageids = messages.get(bigintToSnowflake(message.id))?.id;
  //If It isn't, reject it.
  if (!messageids) return;
  //Check if the user is a bot.
  const user = cache.members.get(snowflakeToBigint(data.userId));
  //If it is a bot, reject the vote.
  if (user?.bot) return;
  const dbvotes = await sql<VoteSchema[]>`SELECT * FROM "VoteSchema"`;
  if (dbvotes.length === 0) return console.log("DB Failed to Create before counting.");
  switch (data.emoji.name) {
    case num[1]:
      {
        sql`UPDATE "VoteSchema" SET "vote" = "vote" + 1 WHERE "numID"=${1}`;
      }
      break;
    case num[2]:
      {
        sql`UPDATE "VoteSchema" SET "vote" = "vote" + 1 WHERE "numID"=${2}`;
      }
      break;
    case num[3]:
      {
        sql`UPDATE "VoteSchema" SET "vote" = "vote" + 1 WHERE "numID"=${3}`;
      }
      break;
  }
}

async function rulesReaction(message: DiscordenoMessage, data: MessageReactionAdd) {
  console.log(`Triggered ReactionAdd: Rules`);
  //get Messages Guild ID.
  const gid = message.guildId;
  const guildint = gid;
  if (!gid) return;
  //Check if the user is a bot.
  const user = cache.guilds.get(guildint)?.members.get(snowflakeToBigint(data.userId));
  if (user?.bot) return;
  //Get The guild.
  const [idm] = await sql<
    GuildSchema[]
  >`SELECT "guildId" FROM "GuildSchema" WHERE "guildId"=${message.guildId.toString()} `;
  const guild = cache.guilds.get(guildint);
  const role = guild?.roles.find((roles) => roles.name === "Verified")?.id;
  if (!role) return;
  //Check if rulesid is the same as message that was reacted to.
  if (bigintToSnowflake(message.id) === idm?.rulesid) return addRole(guildint, snowflakeToBigint(data.userId), role); //Here I need to give a Verified Role.
}
