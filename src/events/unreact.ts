import { MessageReactionUncachedPayload, ReactionPayload } from "../../deps.ts";
import { bot } from "../../cache.ts";
import { messages } from "./messageCreate.ts";
import { db } from "../database/database.ts";
bot.eventHandlers.reactionRemove = async function (message, emoji, userID) {
  pollsUnreact(message, emoji, userID);
};
async function pollsUnreact(message: MessageReactionUncachedPayload, emoji: ReactionPayload, userID: string) {
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
  const dbvotes = await db.votes.get(`1`);
  if (!dbvotes) return console.log("ERROR finding votes DB!");
  switch (emoji.name) {
    case num[1]:
      const candidate1votes = dbvotes.candidate1.votes;
      db.votes.update(`1`, { candidate1: { votes: candidate1votes - 1 } });
      break;
    case num[2]:
      const candidate2votes = dbvotes.candidate2.votes;
      db.votes.update(`1`, { candidate2: { votes: candidate2votes - 1 } });
      break;
    case num[3]:
      const candidate3votes = dbvotes.candidate3.votes;
      db.votes.update(`1`, { candidate3: { votes: candidate3votes - 1 } });
      break;
  }
}
