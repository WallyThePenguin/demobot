import { createCommand, createCustomDataPagination } from "../../utils/helpers.ts";
import { Embed } from "../../utils/Embed.ts";
import { runQuery, autocardscale } from "../../database/client.ts";
import { globalcardlist, usercardinventory } from "../../database/schemas.ts";
import { needButton, needComponentFromOneUser, isSelectmenu, needComponent } from "../../utils/collectors.ts";
import { sendInteractionResponse, snowflakeToBigint, DiscordInteractionResponseTypes } from "../../../deps.ts";
import { SelectMenu } from "../../utils/components.ts";
createCommand({
  name: `cardfusion`,
  aliases: [`cf`, `fuse`],
  description: `Users are able to list every card in the game, they can also view a card with this.`,
  guildOnly: true,
  execute: async (message) => {
    //number of cards per page.
    const cardsperpage = 15;

    //Sort the rows and divide them per page.
    const getembedcount = async (): Promise<number> => {
      const count = Number(
        (
          await runQuery(
            `SELECT COUNT(*) FROM (SELECT id, Count(1) over (partition BY id) AS occurs FROM usercardinventory WHERE userid= $1) as test where occurs > 1`,
            [message.authorId]
          )
        )[0].count
      );
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
      const data = await runQuery<usercardinventory & globalcardlist>(
        `SELECT DISTINCT ON ("usercardinventory"."id") * FROM "usercardinventory" INNER JOIN "globalcardlist" ON "globalcardlist"."id"="usercardinventory"."id" where (SELECT count(*) FROM "usercardinventory" uci WHERE uci.id="usercardinventory"."id") > 1 AND "userid"=$1 OFFSET $2 LIMIT $3`,
        [message.authorId, offset, limit]
      );
      const embed = new Embed().setTitle("Cards You Can Combine.").setFooter(`Page ${embedPage} / ${maxPage}`);
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
              card.level
          )
          .join("\n");
        embed.setDescription(datamap);
      });
      return embed;
    };
    const getQuery = async (embedPage: number): Promise<(usercardinventory & globalcardlist)[]> => {
      const offset = (embedPage - 1) * cardsperpage;
      const limit = cardsperpage;
      const data = await runQuery<usercardinventory & globalcardlist>(
        `SELECT DISTINCT ON ("usercardinventory"."id") * FROM "usercardinventory" INNER JOIN "globalcardlist" ON "globalcardlist"."id"="usercardinventory"."id" where (SELECT count(*) FROM "usercardinventory" uci WHERE uci.id="usercardinventory"."id") > 1 AND "userid"=$1 OFFSET $2 LIMIT $3`,
        [message.authorId, offset, limit]
      );
      return data;
    };
    const page = await createCustomDataPagination(message, getembedcount, getNoneEmbed, getEmbed, getQuery);
    if (!page) return console.log("RIP");
    const selectmenu = new SelectMenu().setCustomId(`1`);
    for (const cards of page) {
      selectmenu.addOption(cards.name, cards.id.toString(), false);
    }
    const buttonreply = await needButton(message.authorId, message.id);
    if (buttonreply.customId === `${message.id}-List`) {
      sendInteractionResponse(snowflakeToBigint(buttonreply.interaction.id), buttonreply.interaction.token, {
        type: DiscordInteractionResponseTypes.UpdateMessage,
        data: { components: [{ type: 1, components: [selectmenu] }] },
      }).catch(console.warn);
    }
    console.log(`I'm Working.`);
    const cardselected = await needComponent(message.id);
    if (!cardselected) return console.log("Failed The Test.");
    if (!isSelectmenu(cardselected)) return console.log(`Failed`);
    if (cardselected.customId === `1`) {
      console.log(`Fuck.`);
    }
    if (isSelectmenu(cardselected)) {
      console.log("Worked.");
      if (selectmenu.customId === `1`) {
        console.log(`Selected Card.`);
        const [card] = cardselected.selectedValues;
        const cardid = Number(card);
        const [findcard] = await runQuery<usercardinventory>(``, []);
        const cardscaled = autocardscale(findcard.cardnumber);
      }
    }
  },
});
