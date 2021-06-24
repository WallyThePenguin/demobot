// This command is intentionally done in an un-optimized way. This command is only to show you how to await a users response.
import { sendMessage } from "../../../deps.ts";
import { needMessage } from "../../utils/collectors.ts";
import { Embed } from "./../../utils/Embed.ts";
import { createCommand, sendEmbed } from "./../../utils/helpers.ts";

createCommand({
  name: `add`,
  guildOnly: true,
  execute: async (message) => {
    sendMessage(message.channelId, "What is the first number you would like to add?");
    const firstNumber = await needMessage(message.authorId, message.channelId);

    const member = message.member;
    if (!member) return;

    const embed = new Embed()
      .setAuthor(member.tag, member.avatarURL)
      .setDescription(`**${firstNumber.content}** Okay, cool! What would you like to add to ${firstNumber.content}?`);

    sendEmbed(message.channelId, embed);
    const secondNumber = await needMessage(message.authorId, message.channelId);

    embed.setDescription(
      `The total of ${firstNumber.content} + ${secondNumber.content} is = **${
        Number(firstNumber.content) + Number(secondNumber.content)
      }**`
    );
    sendEmbed(message.channelId, embed);
  },
});
