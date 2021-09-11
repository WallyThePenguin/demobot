import { createCommand, createCustomDataPagination } from "../../utils/helpers.ts";
import { Embed } from "../../utils/Embed.ts";
import { runQuery, autocardscale } from "../../database/client.ts";
import { globalcardlist, usercardinventory } from "../../database/schemas.ts";
import { needButton, isSelectmenu, needComponentFromOneUser } from "../../utils/collectors.ts";
import { sendInteractionResponse, snowflakeToBigint, DiscordInteractionResponseTypes } from "../../../deps.ts";
import { SelectMenu } from "../../utils/components.ts";
//This took a shitton of work to do, Don't Fuck with this place, Seriously.
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
    //Make the Embed for The Paginator To Sift Through.
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
    //Make A query (Custom Paginator Part, Pls Dont Fuck With.)
    const getQuery = async (embedPage: number): Promise<(usercardinventory & globalcardlist)[]> => {
      const offset = (embedPage - 1) * cardsperpage;
      const limit = cardsperpage;
      const data = await runQuery<usercardinventory & globalcardlist>(
        `SELECT DISTINCT ON ("usercardinventory"."id") * FROM "usercardinventory" INNER JOIN "globalcardlist" ON "globalcardlist"."id"="usercardinventory"."id" where (SELECT count(*) FROM "usercardinventory" uci WHERE uci.id="usercardinventory"."id") > 1 AND "userid"=$1 OFFSET $2 LIMIT $3`,
        [message.authorId, offset, limit]
      );
      return data;
    };
    //HERES THE PAGINATOR FUNCTION
    const page = await createCustomDataPagination(message, getembedcount, getNoneEmbed, getEmbed, getQuery);
    //If The Promises Are Fucked, Throw Returns.
    if (!page) return;
    const cardmenu = page.QueryObject;
    //Same Thing Here.
    if (!cardmenu) return;

    //Cool Thing, Make Menu Options off getQuery Object, Cool Right?
    const selectmenu = new SelectMenu().setCustomId(`1`);
    for (const cards of cardmenu) {
      selectmenu.addOption(`${cards.name} - Level: ${cards.level}`, cards.id.toString(), false);
    }

    //Find ButtonPress For Select.
    const buttonreply = await needButton(message.authorId, message.id);
    if (buttonreply.customId === `${message.id}-Select`) {
      sendInteractionResponse(snowflakeToBigint(buttonreply.interaction.id), buttonreply.interaction.token, {
        type: DiscordInteractionResponseTypes.UpdateMessage,
        data: { components: [{ type: 1, components: [selectmenu] }] },
      }).catch(console.warn);
    }

    //**For Some Unknown Fucking Reason, NeedComponents needs message.id of the actual message itself,
    //dont ask me why, thats why i have messageId on customDataPagination function Promise.*/
    const cardselected = await needComponentFromOneUser(page.messageId, message.authorId, 1);

    //If the Component Isnt a menu, Fuck off, seriously.
    if (!isSelectmenu(cardselected)) return;

    //If it is well good now do the fun stuff :)
    if (isSelectmenu(cardselected)) {
      if (selectmenu.customId === `1`) {
        const [card] = cardselected.selectedValues;
        const cardid = Number(card);
        const [firstcard, secondcard] = await runQuery<usercardinventory>(
          `SELECT * FROM "usercardinventory" WHERE userid=$1 and id=$2 ORDER BY cardnumber ASC`,
          [message.authorId, cardid]
        );
        const updatedcard = await autocardscale(firstcard.cardnumber);
        await runQuery<usercardinventory>(`DELETE FROM "usercardinventory" WHERE cardnumber=$1`, [
          secondcard.cardnumber,
        ]);
        const successembed = new Embed()
          .setTitle(`Card Fusion Complete!`)
          .addField(`Card Upgraded,`, `**${updatedcard?.name}#${updatedcard?.cardnumber}**`)
          .setTimestamp();
        sendInteractionResponse(snowflakeToBigint(cardselected.interaction.id), cardselected.interaction.token, {
          type: DiscordInteractionResponseTypes.UpdateMessage,
          data: { content: `<@${message.authorId}>`, embeds: [successembed] },
        });
        return;
      }
    }
  },
});
