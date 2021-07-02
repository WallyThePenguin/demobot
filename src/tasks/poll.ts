import { Milliseconds } from "../utils/constants/time.ts";
import {
  cache,
  sendMessage,
  addReactions,
  delay,
  getMember,
  snowflakeToBigint,
  bigintToSnowflake,
} from "../../deps.ts";
import { bot } from "../../cache.ts";
import { Embed } from "../utils/Embed.ts";
import { runQuery } from "../database/client.ts";
import { sendEmbed } from "../utils/helpers.ts";
import { messages } from "../events/message_create.ts";
import { VoteSchema, GuildSchema, UserSchema } from "../database/schemas.ts";

bot.tasks.set(`polls`, {
  name: `polls`,
  // Runs this function once every 6 minutes. (1 minute for testing)
  interval: Milliseconds.MINUTE * 6,
  disabled: true,
  execute: async function () {
    // Only run when the bot is fully ready. In case guilds are still loading dont want to send wrong stats.
    if (!cache.isReady) return;
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
    //Get all guilds from the database.
    const allguilds = await runQuery<GuildSchema>(`SELECT * FROM "GuildSchema"`);
    const today = new Date();
    const friday = new Date(today.getTime());
    friday.setDate(today.getDate() + ((7 + 5 - today.getDay()) % 7));
    //IF it's friday, around 5:00 then return guilds. // 17
    //(friday.getDay() === 5 && today.getHours() === 17 && today.getMinutes() <= 10)
    const poo = 1;
    if (poo === 1) {
      console.log("TASK LAUNCHED------------------------------");
      //Get all Users from the Message counter DB
      const userdb = await runQuery<UserSchema>(`SELECT * FROM "UserSchema" ORDER BY messages DESC`);
      //Create a Vote DB that has votes with corresponding candidates.
      await runQuery<VoteSchema>(
        `INSERT INTO "VoteSchema" (id, vote,"numID") VALUES 
        ( $1, 0, 1), 
        ( $2, 0, 2), 
        ( $3, 0, 3)`,
        [userdb[0].id, userdb[1].id, userdb[2].id]
      );
      const embed = new Embed()
        .addField("Candidate 1", `<@${userdb[0].id}> :one: With ${userdb[0].messages} Messages!`)
        .addField("Candidate 2", `<@${userdb[1].id}> :two: With ${userdb[1].messages} Messages!`)
        .addField("Candidate 3", `<@${userdb[2].id}> :three: With ${userdb[2].messages} Messages!`);
      //Send @everyone, embed with candidate choices to all verified guilds.
      for (const guild of allguilds) {
        const g = guild.pollsid;
        sendMessage(snowflakeToBigint(g), `@everyone`);
        //Send an embed with the options to select from
        const e = await sendEmbed(snowflakeToBigint(g), embed);
        addReactions(e.channelId, e.id, [num[1], num[2], num[3]], true);
      }
      //Wait one minute for vote process. (for now)
      await delay(6000);
      //get the vote DB, then sort the votes by most votes, getting the winner.
      const winner = await runQuery<VoteSchema>(`SELECT * FROM "VoteSchema" ORDER BY vote DESC`);
      console.log(winner[0].id, winner[0].vote);
      //Remove Old Leader
      for (const guild of allguilds) {
        const g = cache.guilds.get(guild.guildId);
        const role = g?.roles.find((roles) => roles.name === "Leader")?.id;
        if (!role) continue;

        const findleader = guild.leaderid;
        if (!findleader) continue;

        const oldleader = g?.members.get(snowflakeToBigint(findleader));
        const oldleaderremove = oldleader?.removeRole(guild.guildId, role);
        if (!oldleaderremove) console.log("Unable to remove role.");
      }
      //Give some for this to finish.
      await delay(6000);
      //Make the winner the leader.
      for (const guild of allguilds) {
        const g = cache.guilds.get(guild.guildId);
        const role = g?.roles.find((roles) => roles.name === "Leader")?.id;
        if (!role) {
          console.log(`Can't find leader role in this server ${guild.guildId}`);
          continue;
        }
        const leader = g?.members.get(winner[1].id);
        if (!leader) {
          console.log("Trying out this fix.");
          const test = await getMember(guild.guildId, winner[0].id);
          if (!test) return;
          test.addRole(guild.guildId, role);
          runQuery<GuildSchema>(`UPDATE "GuildSchema" SET leaderid = $1 WHERE "guildId" = $2`, [
            bigintToSnowflake(winner[0].id),
            guild.guildId,
          ]);
          return;
        }
        const addrole = leader?.addRole(guild.guildId, role);
        if (!addrole) {
          console.log(`${winner[1].id} Not in server ${g?.id}`);
        }
        runQuery<GuildSchema>(`UPDATE "GuildSchema" SET leaderid = $1 WHERE "guildId" = $2`, [
          bigintToSnowflake(winner[0].id),
          guild.guildId,
        ]);
        continue;
      }
      //Announce the new leader to all servers.
      for (const guild of allguilds) {
        const g = guild.pollsid;
        sendMessage(snowflakeToBigint(g), `@everyone`);
        const embed = new Embed().addField("The Winner is:", `<@${winner[0].id}>, with ${winner[0].vote} votes!`);
        sendEmbed(snowflakeToBigint(g), embed);
      }
      //After the voting system has finished, just delete the whole userdb.
      runQuery<UserSchema>(`TRUNCATE TABLE "UserSchema"`);
      //Same thing with votes db.
      runQuery<VoteSchema>(`TRUNCATE TABLE "VoteSchema"`);
      //Delete messages Cache.
      messages.clear();
      return;
    } else return false;
  },
});
