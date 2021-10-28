import { createCommand, createSubcommand, createDatabasePagination } from "../../utils/helpers.ts";
import { Embed } from "../../utils/Embed.ts";
import { sql } from "../../database/client.ts";
import { globalcardlist } from "../../database/schemas.ts";
createCommand({
  name: `dictionary`,
  aliases: [`dict`],
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
      const count = Number((await sql<globalcardlist[]>`SELECT COUNT(*) FROM "globalcardlist" WHERE level=1`)[0].count);
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
      const data = await sql<
        globalcardlist[]
      >`SELECT * FROM "globalcardlist" WHERE level=1 ORDER BY id ASC OFFSET ${offset} LIMIT ${limit}`;
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
    { name: `level`, type: `number`, required: false },
  ] as const,
  execute: async (message, args) => {
    if (!args.id && !args.name) return message.reply(`Please Provide an ID or Name (Type Command Again.)`);
    //Got To Place Embed Here For Convenience.
    function newembed(search: globalcardlist): Embed {
      const embed = new Embed()
        .setTitle(`${search.name}`)
        .setThumbnail(`${search.imagelink}`)
        .addField("ID:", `${search.id}`)
        .addField("Level:", `${search.level}`)
        .addField("Rarity:", `${search.rarity}`)
        .addField("Attack:", `${search.attack}`)
        .addField("Ability:", `${search.magic}`)
        .addField("Defence:", `${search.defence}`)
        .addField("Speed:", `${search.speed}`)
        .addField("Description:", `${search.description}`);
      return embed;
    }
    //Make a Constant with both arguments.
    const arg = args.id || args.name;
    const level = args.level;
    //Wanted Level Default For Query.
    let wantedlevel = 1;

    //Figure if Level Is Defined.
    const leveldefined = typeof level === "number";
    //Well If It Isn't Set Default Value To level 1, If it Is, great, give it the value to wantedlevel.
    if (!leveldefined) {
      wantedlevel = 1;
    }
    if (leveldefined) {
      wantedlevel = level!;
    }
    //Figure out what type of argument it is.
    const type = typeof arg;

    //Make a boolean.
    const number = type === "number";

    //Run a query based on the number boolean, if the argument is a number return the id search query, if it is a string return the name query.
    if (number) {
      const [search] = await sql<globalcardlist[]>`SELECT * FROM "globalcardlist" WHERE id=${!arg}`;
      if (!search) return message.reply(`Invalid ID`);
      message.reply({ embeds: [newembed(search)] });
    } else {
      const [search] = await sql<
        globalcardlist[]
      >`SELECT * FROM "globalcardlist" WHERE lower(name)=lower(${!arg}) and level=${wantedlevel}`;
      if (!search) message.reply(`Invalid Name/Level`);
      message.reply({ embeds: [newembed(search)] });
    }
  },
});
