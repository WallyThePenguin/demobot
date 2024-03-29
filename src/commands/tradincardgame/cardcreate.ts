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
    message.reply("Now for the Type of Card? (Attack, Speed, Tank, Magic)");
    const type = await needMessage(message.authorId, message.channelId).catch(console.error);
    if (!type) return;
    if (!["attack", "speed", "tank", "magic"].includes(type.content.toLowerCase()))
      return message.reply("Please put a type value for this! Please try the command again!");
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
    message.reply("how about magic?");
    const magic = await needMessage(message.authorId, message.channelId).catch(console.error);
    if (!magic) return;
    if (isNaN(Number(magic.content))) return;
    message.reply("Provide an Image!");
    const image = await needMessage(message.authorId, message.channelId).catch(console.error);
    if (!image) return;
    if (!image.attachments) return;
    if (!image.attachments?.[0]?.contentType) return;
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
      Number(rarity.content),
      type.content.toLowerCase(),
      Number(magic.content)
    ).catch(console.log);
    if (!id) return console.log(Error);
    //Now Give output (need to implement imagescript into this later.)
    const embed = new Embed()
      .setTitle(`NEW CARD CREATED!`)
      .addField(`ID:`, `${id.id}`)
      .addField(`Type:`, `${type.content.toLowerCase()}`)
      .addField(`Name:`, `${name.content}`)
      .addField(`Attack:`, `${attack.content}`)
      .addField(`Defence:`, `${defence.content}`)
      .addField(`Speed:`, `${speed.content}`)
      .addField(`Rarity:`, `${rarity.content}`)
      .addField(`Description:`, `${description.content}`)
      .setThumbnail(image.attachments[0].url);
    message.reply({ embeds: [embed] });
  },
});
