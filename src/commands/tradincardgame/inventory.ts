import { Embed } from "../../utils/Embed.ts";
import { createCommand, createDatabasePagination, createSubcommand } from "../../utils/helpers.ts";
import { sql } from "../../database/client.ts";
import { usercardinventory, globalcardlist } from "../../database/schemas.ts";
//UNFINISHED, FINISH BEFORE RELEASING.
createCommand({
  name: `inventory`,
  aliases: [`i`, `inv`],
  description: `Look at a users inventory.`,
  arguments: [
    {
      name: "search",
      type: "subcommand",
      required: false,
    },
    {
      name: `user`,
      type: "member",
      required: false,
    },
  ] as const,
  guildOnly: false,
  execute: async (message, args) => {
    const user = args.user?.id || message.authorId;
    const username = args.user?.username || message.member?.username;
    //number of cards per page.
    const cardsperpage = 10;

    //Sort the rows and divide them per page.
    const getembedcount = async (): Promise<number> => {
      const count = Number(
        (await sql<usercardinventory[]>`SELECT COUNT(*) FROM "usercardinventory" WHERE userid = ${user.toString()}`)[0]
          .count
      );
      return Math.ceil(count / cardsperpage);
    };
    //If theres nothing in the embed just return.
    const getNoneEmbed = (): Promise<Embed | undefined> => {
      // Useless stuff so its a promise, You could change the function so it does not require promise
      //deno-lint-ignore no-unused-vars
      return new Promise((resolve, reject) => {
        resolve(new Embed().setTitle(`No Card's Listed Under This User. (${username})`));
      });
    };
    //
    const getEmbed = async (embedPage: number, maxPage: number): Promise<Embed> => {
      const offset = (embedPage - 1) * cardsperpage;
      const limit = cardsperpage;
      const data = await sql<
        (usercardinventory & globalcardlist)[]
      >`SELECT * FROM "usercardinventory" INNER JOIN "globalcardlist" ON "globalcardlist"."id"="usercardinventory"."id" WHERE userid = ${user.toString()} ORDER BY cardnumber ASC OFFSET ${offset} LIMIT ${limit}`;
      const embed = new Embed().setTitle(`${username}\`s inventory`).setFooter(`Page ${embedPage} / ${maxPage}`);
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
              ` **Level:** ` +
              card.level +
              ` **Unique Card ID:** ` +
              card.cardnumber
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
createSubcommand(`inventory`, {
  name: `search`,
  arguments: [
    {
      name: `cardnumber`,
      type: `number`,
      required: true,
    },
  ] as const,
  execute: async (message, args) => {
    const arg = args.cardnumber;

    //Run a query based on the boolean
    const [search] = await sql<
      (usercardinventory & globalcardlist)[]
    >`SELECT * FROM "usercardinventory" INNER JOIN "globalcardlist" ON "globalcardlist"."id"="usercardinventory"."id" WHERE cardnumber = ${!arg}`;
    if (!search) return message.reply(`Invalid ID`);
    //Theory Below For Stat Searching.
    //const [statsearch] = await runQuery<globalcardlist>(`SELECT * FROM "globalcardlist" WHERE name = $1 and level = $2`,[search.name, search.level])
    //Send the info from the query.
    const embed = new Embed()
      .setTitle(`${search.name}`)
      .addField("ID:", `${search.id}`)
      .addField("Owner:", `<@${search.userid}>`)
      .addField("Level:", `${search.level}`);
    message.reply({ embeds: [embed] });
  },
});
