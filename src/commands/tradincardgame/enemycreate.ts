import { Embed } from "../../utils/Embed.ts";
import { createCommand } from "../../utils/helpers.ts";
import { enemycreate } from "../../database/client.ts";
import { needMessage } from "../../utils/collectors.ts";
import { PermissionLevels } from "../../types/commands.ts";
createCommand({
  name: `createenemy`,
  aliases: [`ce`, `enemycreate`],
  permissionLevels: [PermissionLevels.BOT_OWNER],
  description: `This is to create an enemy, strictly to the owner for now. :)`,
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
    if (!["attack", "speed", "tank", "magic"].includes(type.content.toLowerCase()))
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
    //Create the enemy
    const enemy = await enemycreate(name.content, image.content, type.content.toLowerCase(), description.content);
    if (!enemy) return console.log(Error);
    //Now Give output (need to implement imagescript into this later.)
    const embed = new Embed()
      .setTitle(`NEW ENEMY CREATED!`)
      .addField(`ID:`, `${enemy.id}`)
      .addField(`Name:`, `${enemy.name}`)
      .addField(`Type:`, `${enemy.type}`)
      .addField(`Description:`, `${enemy.description}`)
      .setThumbnail(image.attachments[0].url);
    message.reply({ embeds: [embed] });
  },
});
