import { DiscordenoMessage, MessageReactionRemove, bigintToSnowflake } from "../../deps.ts";
import { bot } from "../../cache.ts";
import { messages } from "./message_create.ts";
import { sql } from "../database/client.ts";
import { VoteSchema } from "../database/schemas.ts";
// deno-lint-ignore require-await
bot.eventHandlers.reactionRemove = async function (data, message) {
  if (message) {
    pollsUnreact(message, data);
  }
};
async function pollsUnreact(message: DiscordenoMessage, data: MessageReactionRemove) {
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
  const dbvotes = await sql<VoteSchema[]>`SELECT * FROM "VoteSchema"`;
  if (dbvotes.length === 0) return console.log("ERROR finding votes DB!");
  switch (data.emoji.name) {
    case num[1]:
      {
        sql<VoteSchema[]>`UPDATE "VoteSchema" SET "vote" = "vote" - 1 WHERE "numID"=${1}`;
      }
      break;
    case num[2]:
      {
        sql<VoteSchema[]>`UPDATE "VoteSchema" SET "vote" = "vote" - 1 WHERE "numID"=${2}`;
      }
      break;
    case num[3]:
      {
        sql<VoteSchema[]>`UPDATE "VoteSchema" SET "vote" = "vote" - 1 WHERE "numID"=${3}`;
      }
      break;
  }
}
