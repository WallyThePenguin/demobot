import { createCommand, createSubcommand } from "../../utils/helpers.ts";
import { Embed } from "../../utils/Embed.ts";
import { DeckViewEdit, gamedatacheck } from "../../database/client.ts";
createCommand({
  name: `deck`,
  aliases: [`d`],
  description: `Users Can edit and view there decks with this command.`,
  guildOnly: true,
  arguments: [
    { name: "add", type: "subcommand", required: false },
    { name: "remove", type: "subcommand", required: false },
    {
      name: "view",
      type: "subcommand",
      required: false,
    },
  ] as const,
  execute: (message, args) => {
    if (!args.add && !args.view && !args.remove)
      return message.reply(`You need to choose atleast one subcommand! \`view, edit\``);
  },
});
createSubcommand(`deck`, {
  name: "view",
  execute: async (message) => {
    const check = await gamedatacheck(message.authorId);
    if (check === false)
      return message.reply(`You do not have stats! To get started, use the \`!tradingstart\` or \`!ts\`command.`);
    const deck = await DeckViewEdit(message.authorId, "view");
    if (typeof deck === "number") {
      switch (deck) {
        case 1:
          message.reply("No associated Cardnumber listed under this user.");
          break;
        case 2:
          message.reply("Too many cards in the deck to add another card.");
          break;
        case 3:
          message.reply("No Card To Remove. (Empty Deck)");
          break;
        default:
          message.reply(`An error has occured, Reach out to the developer for help.`);
          break;
      }
    } else {
      const embed = new Embed()
        .setTitle(`${message.member?.username}\`s Deck.`)
        .setDescription(
          `Card 1: ${deck.card1}` +
            `\n` +
            `Card 2: ${deck.card2}` +
            `\n` +
            `Card 3: ${deck.card3}` +
            `\n` +
            `Card 4: ${deck.card4}` +
            `\n` +
            `Card 5: ${deck.card5}`
        );
      message.reply({ embeds: [embed] });
    }
  },
});
//Add Subcommand
createSubcommand(`deck`, {
  name: `add`,
  arguments: [{ name: "cardnumber", type: "string", required: true }] as const,
  execute: async (message, args) => {
    const check = await gamedatacheck(message.authorId);
    if (check === false)
      return message.reply(`You do not have stats! To get started, use the \`!tradingstart\` or \`!ts\`command.`);
    const deck = await DeckViewEdit(message.authorId, "add", Number(args.cardnumber));
    if (typeof deck === "number") {
      switch (deck) {
        case 1:
          message.reply("No associated Cardnumber listed under this user.");
          break;
        case 2:
          message.reply("Too many cards in the deck to add another card.");
          break;
        case 3:
          message.reply("No Card To Remove. (Empty Deck)");
          break;
        default:
          message.reply(`An error has occured, Reach out to the developer for help.`);
          break;
      }
    } else {
      const embed = new Embed()
        .setTitle(`${message.member?.username}\`s New Deck List.`)
        .setDescription(
          `Card 1: ${deck.card1}` +
            `\n` +
            `Card 2: ${deck.card2}` +
            `\n` +
            `Card 3: ${deck.card3}` +
            `\n` +
            `Card 4: ${deck.card4}` +
            `\n` +
            `Card 5: ${deck.card5}`
        );
      message.reply({ embeds: [embed] });
    }
  },
});
createSubcommand(`deck`, {
  name: `remove`,
  arguments: [{ name: "cardnumber", type: "number", required: true }] as const,
  execute: async (message, args) => {
    const check = await gamedatacheck(message.authorId);
    if (check === false)
      return message.reply(`You do not have stats! To get started, use the \`!tradingstart\` or \`!ts\`command.`);
    const deck = await DeckViewEdit(message.authorId, "remove", args.cardnumber);
    if (typeof deck === "number") {
      switch (deck) {
        case 1:
          message.reply("No associated Cardnumber listed under this user.");
          break;
        case 2:
          message.reply("Too many cards in the deck to add another card.");
          break;
        case 3:
          message.reply("No Card To Remove. (Empty Deck)");
          break;
        default:
          message.reply(`An error has occured, Reach out to the developer for help.`);
          break;
      }
    } else {
      const embed = new Embed()
        .setTitle(`${message.member?.username}\`s New Deck List.`)
        .setDescription(
          `Card 1: ${deck.card1}` +
            `\n` +
            `Card 2: ${deck.card2}` +
            `\n` +
            `Card 3: ${deck.card3}` +
            `\n` +
            `Card 4: ${deck.card4}` +
            `\n` +
            `Card 5: ${deck.card5}`
        );
      message.reply({ embeds: [embed] });
    }
  },
});
