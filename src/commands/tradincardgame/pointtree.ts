import { Embed } from "../../utils/Embed.ts";
import { createCommand } from "../../utils/helpers.ts";
import { Components } from "../../utils/components.ts";
import { runQuery, gamedatacheck } from "../../database/client.ts";
import { GameUserSchema } from "../../database/schemas.ts";
import { configs } from "../../../configs.ts";
import { needButton } from "../../utils/collectors.ts";
import {
  sendInteractionResponse,
  snowflakeToBigint,
  DiscordInteractionResponseTypes,
  MessageComponents,
} from "../../../deps.ts";
createCommand({
  name: `stattree`,
  aliases: [`st`, `pointtree`, `tree`],
  description: `If you have levelled up, you can add bonus stats to your tree.`,
  guildOnly: true,
  execute: async (message) => {
    //Check
    const check = gamedatacheck(message.authorId);
    if (!check)
      return message.reply(`You do not have stats! To get started, use the \`!tradingstart\` or \`!ts\`command.`);
    //deno-lint-ignore prefer-const
    let [data] = await runQuery<GameUserSchema>(`SELECT * FROM "GameUserSchema" WHERE id = $1`, [message.authorId]);
    if (!data.health || !data.basicattack || !data.speed || !data.luck || !data.defense || !data.abilitypower)
      return console.log(`Error Getting User Data`);
    const embed = (): Embed =>
      new Embed()
        .setTitle(`Stat Tree`)
        .setDescription(
          `**Health:** ${data.health} **(+${data.health! - configs.defaultstats.health})**\n
      **Defense:** ${data.defense} **(+${data.defense! - configs.defaultstats.defence})**\n
      **Attack:** ${data.basicattack} **(+${data.basicattack! - configs.defaultstats.health})**\n
      **Ability:** ${data.abilitypower} **(+${data.abilitypower! - configs.defaultstats.abilitypower})**\n
      **Speed:** ${data.speed} **(+${data.speed! - configs.defaultstats.speed})**\n
      **Luck:** ${data.luck} **(+${data.luck! - configs.defaultstats.luck})**\n
      **Current Amount Of Points: ${data.statpoints}** \n
      **What Stat Would you like Increase?** (Click a Button)`
        )
        .setTimestamp();
    const buttons = (): MessageComponents =>
      new Components()
        .addButton("Health", "Success", "1", { emoji: "❤️", disabled: data.statpoints <= 0 })
        .addButton("Defense", "Secondary", "2", { emoji: "🛡️", disabled: data.statpoints <= 0 })
        .addButton("Attack", "Danger", "3", { emoji: "🗡️", disabled: data.statpoints <= 0 })
        .addButton("Ability", "Primary", "6", { emoji: "🎩", disabled: data.statpoints <= 0 })
        .addButton("Speed", "Primary", "4", { emoji: "👟", disabled: data.statpoints <= 0 })
        .addButton("Luck", "Success", "5", { emoji: "🍀", disabled: data.statpoints <= 0 });
    const componentmessage = await message.reply({ embeds: [embed()], components: buttons() });
    const buttonreply = await needButton(message.authorId, componentmessage.id);
    switch (buttonreply.customId) {
      case "1":
        {
          const [valuechange] = await runQuery<GameUserSchema>(
            `UPDATE "GameUserSchema" SET "health"="health"+1, "statpoints"="statpoints"-1 WHERE id = $1 and "statpoints" > 0 RETURNING "health", "statpoints"`,
            [message.authorId]
          );
          if (!valuechange) return message.reply(`You do not have anymore StatPoints!`);
          data.health = valuechange.health;
          data.statpoints = valuechange.statpoints;
          sendInteractionResponse(snowflakeToBigint(buttonreply.interaction.id), buttonreply.interaction.token, {
            type: DiscordInteractionResponseTypes.UpdateMessage,
            data: {
              embeds: [embed()],
              components: buttons(),
            },
          }).catch(console.warn);
        }
        break;
      case "2":
        {
          const [valuechange] = await runQuery<GameUserSchema>(
            `UPDATE "GameUserSchema" SET "defense"="defense"+1, "statpoints"="statpoints"-1 WHERE id = $1 and "statpoints" > 0 RETURNING "defense", "statpoints"`,
            [message.authorId]
          );
          if (!valuechange) return message.reply(`You do not have anymore StatPoints!`);
          data.defense = valuechange.defense;
          data.statpoints = valuechange.statpoints;
          sendInteractionResponse(snowflakeToBigint(buttonreply.interaction.id), buttonreply.interaction.token, {
            type: DiscordInteractionResponseTypes.UpdateMessage,
            data: {
              embeds: [embed()],
              components: buttons(),
            },
          }).catch(console.warn);
        }
        break;
      case "3":
        {
          const [valuechange] = await runQuery<GameUserSchema>(
            `UPDATE "GameUserSchema" SET "attack"="attack"+1, "statpoints"="statpoints"-1 WHERE id = $1 and "statpoints" > 0 RETURNING "attack", "statpoints"`,
            [message.authorId]
          );
          if (!valuechange) return message.reply(`You do not have anymore StatPoints!`);
          data.attack = valuechange.attack;
          data.statpoints = valuechange.statpoints;
          sendInteractionResponse(snowflakeToBigint(buttonreply.interaction.id), buttonreply.interaction.token, {
            type: DiscordInteractionResponseTypes.UpdateMessage,
            data: {
              embeds: [embed()],
              components: buttons(),
            },
          }).catch(console.warn);
        }
        break;
      case "4":
        {
          const [valuechange] = await runQuery<GameUserSchema>(
            `UPDATE "GameUserSchema" SET "speed"="speed"+1, "statpoints"="statpoints"-1 WHERE id = $1 and "statpoints" > 0 RETURNING "speed", "statpoints"`,
            [message.authorId]
          );
          if (!valuechange) return message.reply(`You do not have anymore StatPoints!`);
          data.speed = valuechange.speed;
          data.statpoints = valuechange.statpoints;
          sendInteractionResponse(snowflakeToBigint(buttonreply.interaction.id), buttonreply.interaction.token, {
            type: DiscordInteractionResponseTypes.UpdateMessage,
            data: {
              embeds: [embed()],
              components: buttons(),
            },
          }).catch(console.warn);
        }
        break;
      case "5":
        {
          const [valuechange] = await runQuery<GameUserSchema>(
            `UPDATE "GameUserSchema" SET "luck"="luck"+1, "statpoints"="statpoints"-1 WHERE id = $1 and "statpoints" > 0 RETURNING "luck", "statpoints"`,
            [message.authorId]
          );
          if (!valuechange) return message.reply(`You do not have anymore StatPoints!`);
          data.luck = valuechange.luck;
          data.statpoints = valuechange.statpoints;
          sendInteractionResponse(snowflakeToBigint(buttonreply.interaction.id), buttonreply.interaction.token, {
            type: DiscordInteractionResponseTypes.UpdateMessage,
            data: {
              embeds: [embed()],
              components: buttons(),
            },
          }).catch(console.warn);
        }
        break;
      case "6":
        {
          {
            const [valuechange] = await runQuery<GameUserSchema>(
              `UPDATE "GameUserSchema" SET "abilitypower"="abilitypower"+1, "statpoints"="statpoints"-1 WHERE id = $1 and "statpoints" > 0 RETURNING "abilitypower", "statpoints"`,
              [message.authorId]
            );
            if (!valuechange) return message.reply(`You do not have anymore StatPoints!`);
            data.abilitypower = valuechange.abilitypower;
            data.statpoints = valuechange.statpoints;
            sendInteractionResponse(snowflakeToBigint(buttonreply.interaction.id), buttonreply.interaction.token, {
              type: DiscordInteractionResponseTypes.UpdateMessage,
              data: {
                embeds: [embed()],
                components: buttons(),
              },
            }).catch(console.warn);
          }
        }
        break;
    }
  },
});
