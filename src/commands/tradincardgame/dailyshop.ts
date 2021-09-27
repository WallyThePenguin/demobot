import { createCommand } from "../../utils/helpers.ts";
import { Embed } from "../../utils/Embed.ts";
import { runQuery, gamedatacheck, givecard } from "../../database/client.ts";
import { globalcardlist, dailyshop, GameUserSchema } from "../../database/schemas.ts";
import { Components } from "../../utils/components.ts";
import { needButton } from "../../utils/collectors.ts";
import { sendInteractionResponse, snowflakeToBigint, DiscordInteractionResponseTypes } from "../../../deps.ts";
//When Introducing ImageScript Use it in this Command.
createCommand({
  name: `dailyshop`,
  aliases: [`ds`],
  description: `Users are able to list every card in the game, they can also view a card with this.`,
  guildOnly: true,
  arguments: [] as const,
  execute: async (message) => {
    //Check For User Data, if true go through with the command.
    const datacheck = await gamedatacheck(message.authorId);
    if (datacheck === false)
      return message.reply(`You do not have stats! To get started, use the \`!tradingstart\` or \`!ts\`command.`);
    //deno-lint-ignore prefer-const
    let [data] = await runQuery<GameUserSchema>(`SELECT * FROM "GameUserSchema" WHERE id=$1`, [message.authorId]);
    //Gotta Get the Luck, and Money as a let Variable because money data will be edited later.
    let luck = data.luck;
    if (data.luck! > 10) {
      luck = 10;
    }
    //Make Embed for DailyShop.
    async function dailyshopembed(): Promise<Embed> {
      const dailyshopget = await runQuery<dailyshop & globalcardlist>(
        `SELECT * FROM "dailyshop" INNER JOIN "globalcardlist" ON "globalcardlist"."id"=any("dailyshop"."cards") WHERE luck=$1`,
        [luck]
      );
      const embed = new Embed().setTitle(`Daily Shop:`).setFooter(`CardGame.`);
      //deno-lint-ignore no-unused-vars
      dailyshopget.forEach((card) => {
        const datamap = dailyshopget
          .map(
            (card) =>
              `**Name: **` +
              card.name +
              `** Price: **` +
              luck! * 100 +
              `** Type: **` +
              card.type +
              `** Card Level: **` +
              card.level
          )
          .join("\n");
        embed.setDescription(datamap);
      });
      return embed;
    }
    async function dailyshopbuttons(): Promise<Components> {
      const dailyshopget = await runQuery<dailyshop & globalcardlist>(
        `SELECT * FROM "dailyshop" INNER JOIN "globalcardlist" ON "globalcardlist"."id"=any("dailyshop"."cards") WHERE luck=$1`,
        [luck]
      );
      const buttons = new Components();
      dailyshopget.forEach((card) => {
        buttons.addButton(`${card.name}`, "Success", `${card.name}#${card.id}`, {
          disabled: data.money <= luck! * 100,
        });
      });
      return buttons;
    }
    const reply = await message.reply({ embeds: [await dailyshopembed()], components: await dailyshopbuttons() });
    const getbuttonpress = await needButton(message.authorId, reply.id);
    if (getbuttonpress) {
      const [moneyget] = await runQuery<GameUserSchema>(
        `UPDATE "GameUserSchema" SET "money"="money"-${luck! * 100} WHERE id=$1 RETURNING "money"`,
        [message.authorId]
      );
      const newcard = await givecard(Number(getbuttonpress.customId.split(`#`)[1]), message.authorId);
      data.money = moneyget.money;
      sendInteractionResponse(snowflakeToBigint(getbuttonpress.interaction.id), getbuttonpress.interaction.token, {
        type: DiscordInteractionResponseTypes.UpdateMessage,
        data: {
          embeds: [await dailyshopembed()],
          components: await dailyshopbuttons(),
        },
      });
      sendInteractionResponse(snowflakeToBigint(getbuttonpress.interaction.id), getbuttonpress.interaction.token, {
        type: DiscordInteractionResponseTypes.ChannelMessageWithSource,
        data: {
          content: `<@${message.authorId}>! you successfully bought: **${getbuttonpress.customId}** **CardNumber: ${
            newcard.cardnumber
          }** for: ${luck! * 100}, New Money Amount: ${data.money}`,
        },
      });
    }
  },
});
