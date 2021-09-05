import { createCommand, createSubcommand, createDatabasePagination } from "../../utils/helpers.ts";
import { Embed } from "../../utils/Embed.ts";
import { runQuery } from "../../database/client.ts";
import { globalcardlist } from "../../database/schemas.ts";
createCommand({
  name: `dictionary`,
  aliases: [`dict`, `d`],
  description: `Users are able to list every card in the game, they can also view a card with this.`,
  guildOnly: true,
  arguments: [
    { name: "search", type: "subcommand", required: false },
    {
      name: "list",
      type: "subcommand",
      required: false,
    },
  ] as const,
  execute: (message, args) => {
    if (!args.search && !args.list) return message.reply(`You need to choose atleast one subcommand! \`search, list\``);
  },
});
createSubcommand(`dictionary`, {
  name: "list",
  execute: async (message) => {
    //number of cards per page.
    const cardsperpage = 10;

    //Sort the rows and divide them per page.
    const getembedcount = async (): Promise<number> => {
      const count = Number((await runQuery(`SELECT COUNT(*) FROM "globalcardlist"`))[0].count);
      return Math.ceil(count / cardsperpage);
    };
    //If theres nothing in the embed just return.
    const getNoneEmbed = (): Promise<Embed | undefined> => {
      // Useless stuff so its a promise, You could change the function so it does not require promise
      //deno-lint-ignore no-unused-vars
      return new Promise((resolve, reject) => {
        resolve(new Embed().setTitle("None"));
      });
    };
    //
    const getEmbed = async (embedPage: number, maxPage: number): Promise<Embed> => {
      const offset = (embedPage - 1) * cardsperpage;
      const limit = cardsperpage;
      const data = await runQuery<globalcardlist>(`SELECT * FROM "globalcardlist" ORDER BY id ASC OFFSET $1 LIMIT $2`, [
        offset,
        limit,
      ]);
      const embed = new Embed().setTitle("Dictionary List").setFooter(`Page ${embedPage} / ${maxPage}`);
      //deno-lint-ignore no-unused-vars
      data.forEach((card) => {
        const datamap = data
          .map(
            (card) =>
              "**ID:** " +
              card.id +
              " **Name:** " +
              card.name +
              " **Rarity:** " +
              card.rarity +
              ` **Image:** [Link](${card.imagelink})`
          )
          .join("\n");
        embed.setDescription(datamap);
      });
      return embed;
    };
    await createDatabasePagination(message, getembedcount, getNoneEmbed, getEmbed);
  },
});
//Search Subcommand
createSubcommand(`dictionary`, {
  name: `search`,
  arguments: [
    {
      name: `id`,
      type: `number`,
      required: false,
    },
    { name: `name`, type: `string`, required: false },
  ] as const,
  execute: async (message, args) => {
    //Make a Constant with both arguments.
    const arg = args.id || args.name;

    //Figure out what type of argument it is.
    const type = typeof arg;

    //Make a boolean.
    const number = type === "number";

    //Run a query based on the boolean
    const [search] = await runQuery<globalcardlist>(
      `SELECT * FROM "globalcardlist" WHERE ${number ? "id" : "lower(name)"} ${number ? "=$1" : "=lower($1)"}`,
      [arg]
    );

    //Send the info from the query.
    const embed = new Embed()
      .setTitle(`${search.name}`)
      .setThumbnail(`${search.imagelink}`)
      .addField("ID:", `${search.id}`)
      .addField("Rarity:", `${search.rarity}`)
      .addField("Attack:", `${search.attack}`)
      .addField("Defence:", `${search.defence}`)
      .addField("Speed:", `${search.speed}`)
      .addField("Description:", `${search.description}`);
    message.reply({ embeds: [embed] });
  },
});
