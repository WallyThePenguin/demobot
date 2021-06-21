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
import { messages } from "./messageCreate.ts";
import { db } from "../database/database.ts";
// deno-lint-ignore require-await
bot.eventHandlers.reactionAdd = async function (data, message) {
  pollsReaction(message, data);
  rulesReaction(message, data);
  processReactionCollectors(message, emoji, userID);
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
  const dbvotes = await db.votes.get(`1`);
  if (!dbvotes) return console.log("DB Failed to Create before counting.");
  switch (data.emoji.name) {
    case num[1]:
      const candidate1votes = dbvotes.candidate1.votes + 1;
      db.votes.update(`1`, { candidate1: { votes: candidate1votes } });
      break;
    case num[2]:
      const candidate2votes = dbvotes.candidate2.votes + 1;
      db.votes.update(`1`, { candidate2: { votes: candidate2votes } });
      break;
    case num[3]:
      const candidate3votes = dbvotes.candidate3.votes + 1;
      db.votes.update(`1`, { candidate3: { votes: candidate3votes } });
      break;
  }
}

async function rulesReaction(message: DiscordenoMessage, data: MessageReactionAdd) {
  //get Messages Guild ID.
  const gid = message.guildId;
  const guildflake = bigintToSnowflake(gid);
  const guildint = gid;
  if (!gid) return;
  //Check if the user is a bot.
  const user = cache.guilds.get(guildint)?.members.get(snowflakeToBigint(data.userId));
  if (user?.bot) return;
  const idm = await db.guilds.get(guildflake);
  const guild = cache.guilds.get(guildint);
  const role = guild?.roles.find((roles) => roles.name === "Verified")?.id;
  if (!role) return;
  if (bigintToSnowflake(message.id) === idm?.rulesid) return addRole(guildint, snowflakeToBigint(data.userId), role); //Here I need to give a Verified Role.
}
