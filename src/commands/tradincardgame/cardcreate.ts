import { Embed } from "../../utils/Embed.ts";
import { createCommand } from "../../utils/helpers.ts";
import { cardcreate } from "../../database/client.ts";
import { needMessage } from "../../utils/collectors.ts";
import { PermissionLevels } from "../../types/commands.ts";
createCommand({
  name: `createcard`,
  aliases: [`cc`],
  permissionLevels: [PermissionLevels.BOT_OWNER],
  description: `This is to create a card, strictly to the owner for now. :)`,
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
    if (isNaN(Number(level.content))) return;
    message.reply("Now for attack?");
    const attack = await needMessage(message.authorId, message.channelId).catch(console.error);
    if (!attack) return;
    if (isNaN(Number(attack.content))) return;
    message.reply("and defence?");
    const defence = await needMessage(message.authorId, message.channelId).catch(console.error);
    if (!defence) return;
    if (isNaN(Number(defence.content))) return;
    message.reply("how about speed?");
    const speed = await needMessage(message.authorId, message.channelId).catch(console.error);
    if (!speed) return;
    if (isNaN(Number(speed.content))) return;
    message.reply("Provide an Image!");
    const image = await needMessage(message.authorId, message.channelId).catch(console.error);
    if (!image) return;
    if (!image.attachments) return;
    if (image.attachments?.[0]?.contentType !== "image/png") return;
    message.reply("Provide an Description!");
    const description = await needMessage(message.authorId, message.channelId).catch(console.error);
    if (!description) return;
    message.reply("How rare is this?");
    const rarity = await needMessage(message.authorId, message.channelId).catch(console.error);
    if (!rarity) return;
    if (isNaN(Number(rarity.content))) return;
    //Create card based off of the stats given.
    const id = await cardcreate(
      name.content,
      Number(level.content),
      Number(attack.content),
      Number(defence.content),
      Number(speed.content),
      image.attachments[0].url,
      description.content,
      Number(rarity.content)
    ).catch(console.log);
    if (!id) return;
    //Now Give output (need to implement imagescript into this later.)
    const embed = new Embed()
      .setTitle(`NEW CARD CREATED!`)
      .addField(`ID:`, `${id.id}`)
      .addField(`Name:`, `${name.content}`)
      .addField(`Attack:`, `${attack.content}`)
      .addField(`Defence:`, `${defence.content}`)
      .addField(`Speed:`, `${speed.content}`)
      .addField(`Description:`, `${description.content}`)
      .setThumbnail(image.attachments[0].url);
    message.reply({ embeds: [embed] });
  },
});
