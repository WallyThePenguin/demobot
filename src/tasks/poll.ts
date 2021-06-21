import { Milliseconds } from "../utils/constants/time.ts";
import { cache, sendMessage, addReactions, delay, getMember, snowflakeToBigint } from "../../deps.ts";
import { bot } from "../../cache.ts";
import { Embed } from "../utils/Embed.ts";
import { db } from "../database/database.ts";
import { sendEmbed } from "../utils/helpers.ts";
import { messages } from "../events/message_create.ts";

bot.tasks.set(`polls`, {
  name: `polls`,
  // Runs this function once every 6 minutes. (1 minute for testing)
  interval: Milliseconds.MINUTE * 1,
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
    const allguilds = await db.guilds.getAll(true);
    const today = new Date();
    const friday = new Date(today.getTime());
    friday.setDate(today.getDate() + ((7 + 5 - today.getDay()) % 7));
    //IF it's friday, around 5:00 then return guilds. // 17
    //(friday.getDay() === 5 && today.getHours() === 17 && today.getMinutes() <= 10)
    const poo = 1;
    if (poo === 1) {
      console.log("TASK LAUNCHED------------------------------");
      const userbase = await db.users.getAll(true);
      const userdb = userbase.sort((a, b) => b.messages - a.messages);
      //Create a Vote DB that has votes with corresponding candidates.
      db.votes.create(`1`, {
        candidate1: { id: userdb[0].id, votes: 0 },
        candidate2: { id: userdb[1].id, votes: 0 },
        candidate3: { id: userdb[2].id, votes: 0 },
      });
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
      //get the vote DB
      const votebase = await db.votes.getAll(true);
      //Sort the votes by most votes is the winner
      const candidates = Object.values(votebase[0]);
      const winner = candidates.sort((x, y) => y.votes - x.votes);
      console.log(JSON.stringify(winner[1]));
      //Remove Old Leader
      for (const guild of allguilds) {
        const g = cache.guilds.get(snowflakeToBigint(guild.id));
        const role = g?.roles.find((roles) => roles.name === "Leader")?.id;
        if (!role) continue;

        const findleader = guild.leaderid;
        if (!findleader) continue;

        const oldleader = g?.members.get(snowflakeToBigint(findleader));
        const oldleaderremove = oldleader?.removeRole(snowflakeToBigint(guild.id), role);
        if (!oldleaderremove) console.log("Unable to remove role.");
      }
      //Give some for this to finish.
      await delay(6000);
      //Make the winner the leader.
      for (const guild of allguilds) {
        const g = cache.guilds.get(snowflakeToBigint(guild.id));
        const role = g?.roles.find((roles) => roles.name === "Leader")?.id;
        if (!role) {
          console.log("Can't Find leader role in this server");
          continue;
        }
        const leader = g?.members.get(winner[1].id);
        if (!leader) {
          console.log("Trying out this fix.");
          const test = await getMember(snowflakeToBigint(guild.id), winner[1].id);
          if (!test) return;
          test.addRole(snowflakeToBigint(guild.id), role);
          db.guilds.update(guild.id, { leaderid: winner[1].id });
          return;
        }
        const addrole = leader?.addRole(snowflakeToBigint(guild.id), role);
        if (!addrole) {
          console.log(`${winner[1].id} Not in server ${g?.id}`);
        }
        db.guilds.update(guild.id, { leaderid: winner[1].id });
        continue;
      }
      //Announce the new leader to all servers.
      for (const guild of allguilds) {
        const g = guild.pollsid;
        sendMessage(snowflakeToBigint(g), `@everyone`);
        const embed = new Embed().addField("The Winner is:", `<@${winner[1].id}>!`);
        sendEmbed(snowflakeToBigint(g), embed);
      }
      //After the voting system has finished, just delete the whole userdb.
      db.users.deleteMany({});
      //Same thing with votes db.
      db.votes.deleteMany({});
      //Delete messages Cache.
      messages.clear();
      return;
    } else return false;
  },
});
