import { Embed } from "../../utils/Embed.ts";
import { createCommand } from "../../utils/helpers.ts";
import { givecard, searchcard } from "../../database/client.ts";
import { PermissionLevels } from "../../types/commands.ts";
createCommand({
  name: `givecard`,
  aliases: [`gc`],
  permissionLevels: [PermissionLevels.BOT_OWNER],
  description: `This is to give a card, strictly to the owner for now. :)`,
  guildOnly: false,
  arguments: [
    {
      name: "cardid",
      type: "number",
      required: true,
    },
    { name: "user", type: "member", required: false },
    { name: "level", type: "number", required: false },
    { name: "indeck", type: "boolean", required: false },
  ] as const,
  execute: async (message, args) => {
    const user = args.user?.id || message.authorId;
    const cardgiven = await givecard(args.cardid, user, args?.level, args?.indeck);
    const cardsearch = await searchcard(args.cardid);
    const embed = new Embed()
      .setTitle(`New Card Given!`)
      .setThumbnail(`${cardsearch.imagelink}`)
      .addField(`<@${cardgiven.userid}>`, `Got Card: ${cardsearch.name} #${cardsearch.id}`)
      .addField(`Unique Card ID:`, `${cardgiven.cardnumber}`)
      .addField(`Want To Know More?`, `Use !dictionary command to learn more about the card!`);
    message.reply({ embeds: [embed] });
  },
});
