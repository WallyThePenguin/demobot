import {
  createGuildFromTemplate,
  delay,
  addReaction,
  cache,
  sendMessage,
  createInvite,
  bigintToSnowflake,
} from "../../../deps.ts";
import { PermissionLevels } from "../.././types/commands.ts";
import { Embed } from "../../utils/Embed.ts";
import { sendEmbed, createCommand } from "../../utils/helpers.ts";
import { setupRules, imagerules, vcrules, pollinghelp } from "../../../conflist.ts";
import { runQuery } from "../../database/client.ts";
createCommand({
  name: "setup",
  dmOnly: false,
  guildOnly: false,
  nsfw: false,
  permissionLevels: [PermissionLevels.BOT_OWNER],
  botServerPermissions: [],
  botChannelPermissions: ["SEND_MESSAGES"],
  userServerPermissions: [],
  userChannelPermissions: [],
  description: "Sets up a brand new Guild to run a new session of Project Democracy",
  arguments: [
    {
      name: "ServerName",
      type: "...strings",
      defaultValue: "New Server",
    },
  ],
  execute: async function (message, args) {
    //Creating Guild/Server From Template ID, Uses ARGS only for Servername.
    const guild = await createGuildFromTemplate("RxHNYkBxpqbb", { name: args.ServerName });
    if (!guild) return sendMessage(message.channelId, "Attempt to create server has failed!");

    //Getting the System_Channel_ID to Create An  Invite later on.
    const chanid = guild.systemChannelId;
    if (!chanid) return sendMessage(message.channelId, "error getting system channel id");

    // 1.5 second delay so the server has time to fully load.
    await delay(1500);

    // the constant guild doesn't give me channels, so the constant fullGuild will.
    const fullGuild = cache.guilds.get(guild.id);
    if (!fullGuild) return sendMessage(message.channelId, "Error Getting Guild ID");

    //The Template Has a Rules channel so we're finding the ID by looking for the name of it.
    const ruleid = fullGuild.channels.find((channels) => channels.name === "rules")?.id;
    if (!ruleid) return sendMessage(message.channelId, "Error getting rules channel id");

    //The rules are setup and exported in my dependencies file, I send it in this embed
    const rules = await sendEmbed(ruleid, setupRules);
    if (!rules) return sendMessage(message.channelId, "Error Getting Embed Promises for rules."); // I want to react to this embed. with a thumbsup emoji.
    addReaction(rules.channelId, rules.id, "👍");

    // I also have a set of image rules and voice rules So i also send them to the rules channel.
    sendEmbed(ruleid, imagerules);
    sendEmbed(ruleid, vcrules);

    //Auto Polling System needs to find a channel: I called this Channel polls
    const pollsid = fullGuild.channels.find((channels) => channels.name === "polls")?.id;
    if (!pollsid) return sendMessage(message.channelId, "Error getting polls channel id");
    const polls = await sendEmbed(pollsid, pollinghelp);
    if (!polls) return sendMessage(message.channelId, "Error Getting Embed Promises for polls.");

    // Add the message.id to rulesid and polls channelid in guildschema.
    await runQuery(
      `INSERT INTO GuildSchema(guildId, rulesid, pollsid)
    VALUES($1, $2, $3)`,
      [fullGuild.id, bigintToSnowflake(rules.id), bigintToSnowflake(polls.channelId)]
    );

    //Creating a permanent invite when all of this has been done.
    const inv = await createInvite(chanid, {
      maxAge: 0,
      maxUses: 0,
      temporary: false,
      unique: true,
    });
    if (!inv) return sendMessage(message.channelId, "Unable to create server invite.");

    //Send an Invite and basic server info.
    const setupcomp = new Embed()
      .setColor("#1cff7e")
      .setTitle(`Setup Complete`)
      .addField("Name:", args.ServerName)
      .addField("Created By:", `<@${message.authorId}>`)
      .addField("Server ID:", `${guild.id}`)
      .addField("Server Invite:", `[https://discord.gg/${inv.code}](https://discord.gg/${inv.code})`, true)
      .setTimestamp();

    sendEmbed(message.channelId, setupcomp);
  },
});
