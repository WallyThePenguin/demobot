import { cache, addRole, MessageReactionUncachedPayload, ReactionPayload } from "../../deps.ts";
import { bot } from "../../cache.ts";
import { processReactionCollectors } from "../utils/collectors.ts";
import { messages } from "./messageCreate.ts";
import { db } from "../database/database.ts";
bot.eventHandlers.reactionAdd = async function (message, emoji, userID) {
  pollsReaction(message, emoji, userID);
  rulesReaction(message, emoji, userID);
  processReactionCollectors(message, emoji, userID);
};

async function pollsReaction(message: MessageReactionUncachedPayload, emoji: ReactionPayload, userID: string) {
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
  const messageids = messages.get(message.id)?.id;
  //If It isn't, reject it.
  if (!messageids) return;
  //Check if the user is a bot.
  const user = cache.members.get(userID);
  //If it is a bot, reject the vote.
  if (user?.bot) return;
  const dbvotes = await db.votes.get(`1`);
  if (!dbvotes) return console.log("DB Failed to Create before counting.");
  switch (emoji.name) {
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

async function rulesReaction(message: MessageReactionUncachedPayload, _emoji: ReactionPayload, userID: string) {
  //get Messages Guild ID.
  const guildid = message.guildID;
  if (!guildid) return;
  //Check if the user is a bot.
  const user = cache.guilds.get(guildid)?.members.get(userID);
  if (user?.bot) return;
  const idm = await db.guilds.get(guildid);
  const guild = cache.guilds.get(guildid);
  const role = guild?.roles.find((roles) => roles.name === "Verified")?.id;
  if (!role) return;
  if (message.id === idm?.rulesid) return addRole(guildid, userID, role); //Here I need to give a Verified Role.
}
