import { Embed } from "../../utils/Embed.ts";
import { createCommand } from "../../utils/helpers.ts";
import { needMessage } from "../../utils/collectors.ts";
import { sendWebhook } from "../../../deps.ts";
import { configs } from "../../../configs.ts";
createCommand({
  name: `suggestenemy`,
  aliases: [`se`],
  description: `Suggest an Enemy.`,
  guildOnly: false,
  execute: async (message) => {
    //Send a reply
    message.reply("Hello~ What name would you like for your enemy?");
    //Await a message
    const name = await needMessage(message.authorId, message.channelId).catch(console.error);
    if (!name) return;
    //Repeat
    message.reply("Now for the Type of Enemy? (Attack, Speed, Tank, Magic)");
    const type = await needMessage(message.authorId, message.channelId).catch(console.error);
    if (!type) return;
    if (type.content.toLowerCase() !== "attack" || "speed" || "tank" || "magic")
      return message.reply("Please put a type value for this! Please try the command again!");
    message.reply("Provide an Image! (Attach an image)");
    const image = await needMessage(message.authorId, message.channelId).catch(console.error);
    if (!image) return;
    if (!image.attachments) return;
    if (image.attachments?.[0]?.contentType !== "image/png")
      return message.reply("Please attach/upload an image! Please try the command again!");
    message.reply("Provide an Description!");
    const description = await needMessage(message.authorId, message.channelId).catch(console.error);
    if (!description) return;
    //Make embed based on args given.
    const embed = new Embed()
      .setTitle(`NEW ENEMY SUGGESTED!`)
      .addField(`User:`, `<@${message.authorId}>`)
      .addField(`Name:`, `${name.content}`)
      .addField(`Type:`, `${type.content}`)
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
