import { createCommand, createCustomDataPaginationChests } from "../../utils/helpers.ts";
import { Embed } from "../../utils/Embed.ts";
import { sql, chestdrop, searchcard } from "../../database/client.ts";
import { chestinventoryschema } from "../../database/schemas.ts";
import { needButton, isSelectmenu, needComponentFromOneUser } from "../../utils/collectors.ts";
import { sendInteractionResponse, snowflakeToBigint, DiscordInteractionResponseTypes } from "../../../deps.ts";
import { SelectMenu } from "../../utils/components.ts";
//This took a shitton of work to do, Don't Fuck with this place, Seriously.
createCommand({
  name: `openchest`,
  aliases: [`oc`, `open`],
  description: `Open Chests you get with this with this command.`,
  guildOnly: true,
  execute: async (message) => {
    //number of cards per page.
    const chestsperpage = 15;

    //Sort the rows and divide them per page.
    const getembedcount = async (): Promise<number> => {
      const count = Number(
        (
          await sql<
            chestinventoryschema[]
          >`SELECT COUNT(*) FROM "userchestinventory" WHERE userid=${message.authorId.toString()}`
        )[0].count
      );
      return Math.ceil(count / chestsperpage);
    };
    //If theres nothing in the embed just return.
    const getNoneEmbed = (): Promise<Embed | undefined> => {
      // Useless stuff so its a promise, You could change the function so it does not require promise
      //deno-lint-ignore no-unused-vars
      return new Promise((resolve, reject) => {
        resolve(new Embed().setTitle("No Chests."));
      });
    };
    //Make the Embed for The Paginator To Sift Through.
    const getEmbed = async (embedPage: number, maxPage: number): Promise<Embed> => {
      const offset = (embedPage - 1) * chestsperpage;
      const limit = chestsperpage;
      const data = await sql<
        chestinventoryschema[]
      >`SELECT * FROM "userchestinventory" WHERE userid=${message.authorId.toString()} ORDER BY chestid ASC OFFSET ${offset} LIMIT ${limit}`;
      const embed = new Embed().setTitle("Chests You Can Open.").setFooter(`Page ${embedPage} / ${maxPage}`);
      //deno-lint-ignore no-unused-vars
      data.forEach((chest) => {
        const datamap = data.map((chest) => " **ID:** " + chest.chestid + " **Level:** " + chest.chestlevel).join("\n");
        embed.setDescription(datamap);
      });
      return embed;
    };
    //Make A query (Custom Paginator Part, Pls Dont Fuck With.)
    const getQuery = async (embedPage: number): Promise<chestinventoryschema[]> => {
      const offset = (embedPage - 1) * chestsperpage;
      const limit = chestsperpage;
      const data = await sql<
        chestinventoryschema[]
      >`SELECT * FROM "userchestinventory" WHERE userid=${message.authorId.toString()} ORDER BY chestid ASC OFFSET ${offset} LIMIT ${limit}`;
      return data;
    };
    //HERES THE PAGINATOR FUNCTION
    const page = await createCustomDataPaginationChests(message, getembedcount, getNoneEmbed, getEmbed, getQuery);
    //If The Promises Are Fucked, Throw Returns.
    if (!page) return;
    const chestmenu = page.QueryObject;
    //Same Thing Here.
    if (!chestmenu) return;

    //Cool Thing, Make Menu Options off getQuery Object, Cool Right?
    const selectmenu = new SelectMenu().setCustomId(`1`);
    for (const chests of chestmenu) {
      selectmenu.addOption(`Level: ${chests.chestlevel}`, chests.chestid.toString(), false);
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
    const chestselected = await needComponentFromOneUser(page.messageId, message.authorId, 1);

    //If the Component Isnt a menu, Fuck off, seriously.
    if (!isSelectmenu(chestselected)) return;

    //If it is well good now do the fun stuff :)
    if (isSelectmenu(chestselected)) {
      if (selectmenu.customId === `1`) {
        const [chest] = chestselected.selectedValues;
        const chestid = Number(chest);
        const chestopen = await chestdrop(chestid, message.authorId);
        const cardanalysis = await searchcard(chestopen.id);
        const successembed = new Embed()
          .setTitle(`Chest Opened!`)
          .addField(`You Got...`, `**${cardanalysis.name}#${cardanalysis?.cardnumber}**`)
          .setTimestamp();
        sendInteractionResponse(snowflakeToBigint(chestselected.interaction.id), chestselected.interaction.token, {
          type: DiscordInteractionResponseTypes.UpdateMessage,
          data: { content: `<@${message.authorId}>`, embeds: [successembed] },
        });
        return;
      }
    }
  },
});
