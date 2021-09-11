import {
  ComponentInteraction,
  DiscordInteractionResponseTypes,
  DiscordInteractionTypes,
  DiscordMessageComponentTypes,
  sendInteractionResponse,
  snowflakeToBigint,
} from "../../../deps.ts";
import { bot } from "../../../cache.ts";
import { needComponentReturns } from "../../types/collectors.ts";

bot.interactionListeners.set("components", {
  filter: (data) => data.type === DiscordInteractionTypes.MessageComponent,
  execute: async (data, member) => {
    const interaction = data as ComponentInteraction;

    // Collectors
    if (!member) return;

    const collector = data.message?.messageReference?.messageId // Get data from nested interaction
      ? bot.componentCollectors.get(snowflakeToBigint(data.message.messageReference.messageId))
      : data.message?.interaction?.id // Get data from normal interaction
      ? bot.componentCollectors.get(snowflakeToBigint(data.message.interaction.id))
      : data.message?.id // Get data from message (Not interaction)
      ? bot.componentCollectors.get(snowflakeToBigint(data.message.id))
      : undefined;
    if (!collector) return;

    // Check filter
    if (collector.filter) {
      const passed = collector.filter(data, member);
      if (!passed) return console.log("Failed to Pass.");
    }

    // Send response to Discord so button does not show the error message
    await sendInteractionResponse(data.id, data.token, {
      type: DiscordInteractionResponseTypes.DeferredUpdateMessage,
    }).catch(console.warn);
    //
    let returningData: needComponentReturns | undefined;

    switch (interaction.data?.componentType) {
      case DiscordMessageComponentTypes.Button:
        returningData = {
          customId: interaction.data.customId,
          type: "button",
          interaction: interaction,
          member: member,
        };
        break;

      case DiscordMessageComponentTypes.SelectMenu:
        returningData = {
          customId: interaction.data.customId,
          type: "selectMenu",
          interaction: interaction,
          member: member,
          selectedValues: interaction.data.values,
        };
        break;

      default:
        console.warn("Unexpected component type", interaction);
        break;
    }

    if (!returningData) return;
    collector.resolve(returningData);
    bot.componentCollectors.delete(collector.interactionOrMessageId);
  },
});
