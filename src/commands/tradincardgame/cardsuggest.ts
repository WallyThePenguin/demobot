import { Embed } from "../../utils/Embed.ts";
import { createCommand } from "../../utils/helpers.ts";
import { needMessage } from "../../utils/collectors.ts";
import { sendMessage, snowflakeToBigint } from "../../../deps.ts";
import { configs } from "../../../configs.ts";
createCommand({
  name: `suggestcard`,
  aliases: [`sc`],
  description: `Suggest a Card.`,
  guildOnly: false,
  execute: async (message) => {
    //Send a reply
    message.reply("Hello~ What name would you like for your card?");
    //Await a message
    const name = await needMessage(message.authorId, message.channelId).catch(console.error);
    if (!name) return;
    //Repeat
    message.reply("What about the level?");
    const level = await needMessage(message.authorId, message.channelId).catch(console.error);
    if (!level) return;
    if (isNaN(Number(level.content)))
      return message.reply("Please put a number value for this! Please try the command again!");
    message.reply("Now for attack?");
    const attack = await needMessage(message.authorId, message.channelId).catch(console.error);
    if (!attack) return;
    if (isNaN(Number(attack.content)))
      return message.reply("Please put a number value for this! Please try the command again!");
    message.reply("and defence?");
    const defence = await needMessage(message.authorId, message.channelId).catch(console.error);
    if (!defence) return;
    if (isNaN(Number(defence.content)))
      return message.reply("Please put a number value for this! Please try the command again!");
    message.reply("how about speed?");
    const speed = await needMessage(message.authorId, message.channelId).catch(console.error);
    if (!speed) return;
    if (isNaN(Number(speed.content)))
      return message.reply("Please put a number value for this! Please try the command again!");
    message.reply("Provide an Image!");
    const image = await needMessage(message.authorId, message.channelId).catch(console.error);
    if (!image) return;
    if (!image.attachments) return;
    if (image.attachments?.[0]?.contentType !== "image/png")
      return message.reply("Please attach an image! Please try the command again!");
    message.reply("Provide an Description!");
    const description = await needMessage(message.authorId, message.channelId).catch(console.error);
    if (!description) return;
    message.reply("How rare is this?");
    const rarity = await needMessage(message.authorId, message.channelId).catch(console.error);
    if (!rarity) return;
    if (isNaN(Number(rarity.content)))
      return message.reply("Please put a number value for this! Please try the command again!");
    const embed = new Embed()
      .setTitle(`NEW CARD SUGGESTED!`)
      .addField(`User:`, `<@${message.authorId}>`)
      .addField(`Name:`, `${name.content}`)
      .addField(`Attack:`, `${attack.content}`)
      .addField(`Defence:`, `${defence.content}`)
      .addField(`Speed:`, `${speed.content}`)
      .addField(`Description:`, `${description.content}`)
      .setThumbnail(image.attachments[0].url);
    message.reply(`Message send for review:` + { embeds: [embed] });
    sendMessage(snowflakeToBigint(configs.suggestWebhook), { embeds: [embed] });
  },
});
