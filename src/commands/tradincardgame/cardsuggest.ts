import { Embed } from "../../utils/Embed.ts";
import { createCommand } from "../../utils/helpers.ts";
import { needMessage } from "../../utils/collectors.ts";
import { sendWebhook } from "../../../deps.ts";
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
    message.reply("Now for attack? (Number)");
    const attack = await needMessage(message.authorId, message.channelId).catch(console.error);
    if (!attack) return;
    if (isNaN(Number(attack.content)))
      return message.reply("Please put a number value for this! Please try the command again!");
    message.reply("and defence? (Number)");
    const defence = await needMessage(message.authorId, message.channelId).catch(console.error);
    if (!defence) return;
    if (isNaN(Number(defence.content)))
      return message.reply("Please put a number value for this! Please try the command again!");
    message.reply("how about speed? (Number)");
    const speed = await needMessage(message.authorId, message.channelId).catch(console.error);
    if (!speed) return;
    if (isNaN(Number(speed.content)))
      return message.reply("Please put a number value for this! Please try the command again!");
    message.reply("Provide an Image! (Attach an image)");
    const image = await needMessage(message.authorId, message.channelId).catch(console.error);
    if (!image) return;
    if (!image.attachments) return;
    if (!image.attachments?.[0]?.contentType)
      return message.reply("Please attach/upload an image! Please try the command again!");
    message.reply("Provide an Description!");
    const description = await needMessage(message.authorId, message.channelId).catch(console.error);
    if (!description) return;
    message.reply("Now for the Type of Card? (Attack, Speed, Tank, Magic)");
    const type = await needMessage(message.authorId, message.channelId).catch(console.error);
    if (!type) return;
    if (!["attack", "speed", "tank", "magic"].includes(type.content.toLowerCase()))
      return message.reply("Please put a type value for this! Please try the command again!");
    message.reply("How rare is this? (1 - 10)");
    const rarity = await needMessage(message.authorId, message.channelId).catch(console.error);
    if (!rarity) return;
    if (isNaN(Number(rarity.content)))
      return message.reply("Please put a number value for this! Please try the command again!");
    if (Number(rarity.content) > 10) return message.reply("That Number is too high! Please Try Again!");
    //Make embed based on args given.
    const embed = new Embed()
      .setTitle(`NEW CARD SUGGESTED!`)
      .addField(`User:`, `<@${message.authorId}>`)
      .addField(`Type:`, `${type.content.toLowerCase()}`)
      .addField(`Name:`, `${name.content}`)
      .addField(`Attack:`, `${attack.content}`)
      .addField(`Defence:`, `${defence.content}`)
      .addField(`Speed:`, `${speed.content}`)
      .addField(`Rarity:`, `${rarity.content}/10`)
      .addField(`Description:`, `${description.content}`)
      .setThumbnail(image.attachments[0].url);
    //Now send them a "reciept" of what they made.
    message.reply({ content: "Information Sent for Review:", embeds: [embed] });
    //Send webhook to the support server where owner and support staff can sort through.
    await sendWebhook(configs.suggestWebhook, configs.webhooktoken, {
      content: `<@258337390643511306>`,
      embeds: [embed],
    });
  },
});
