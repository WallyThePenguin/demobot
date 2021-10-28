import { bot } from "../../cache.ts";
import {
  cache,
  Collection,
  deleteMessage,
  deleteMessages,
  DiscordButtonStyles,
  DiscordenoMessage,
  DiscordMessageComponentTypes,
  editMessage,
  editWebhookMessage,
  Emoji,
  fetchMembers,
  getMember,
  MessageComponents,
  removeReaction,
  sendInteractionResponse,
  sendMessage,
  snowflakeToBigint,
  ws,
  editSlashResponse,
  Interaction,
  DiscordenoMember,
  DiscordInteractionResponseTypes,
  deleteSlashResponse,
  CreateMessage,
  bigintToSnowflake,
  botHasChannelPermissions,
} from "../../deps.ts";
import { ArgumentDefinition, Command } from "../types/commands.ts";
import { needButton, needMessage, needReaction } from "./collectors.ts";
import { Milliseconds } from "./constants/time.ts";
import { Embed } from "./Embed.ts";
import { log } from "./logger.ts";
import { usercardinventory, globalcardlist, chestinventoryschema } from "../database/schemas.ts";
/** This function should be used when you want to convert milliseconds to a human readable format like 1d5h. */
export function humanizeMilliseconds(milliseconds: number) {
  // Gets ms into seconds
  const time = milliseconds / 1000;
  if (time < 1) return "1s";

  const days = Math.floor(time / 86400);
  const hours = Math.floor((time % 86400) / 3600);
  const minutes = Math.floor(((time % 86400) % 3600) / 60);
  const seconds = Math.floor(((time % 86400) % 3600) % 60);

  const dayString = days ? `${days}d ` : "";
  const hourString = hours ? `${hours}h ` : "";
  const minuteString = minutes ? `${minutes}m ` : "";
  const secondString = seconds ? `${seconds}s ` : "";

  return `${dayString}${hourString}${minuteString}${secondString}`;
}

/** This function helps convert a string like 1d5h to milliseconds. */
export function stringToMilliseconds(text: string) {
  const matches = text.match(/(\d+[w|d|h|m|s]{1})/g);
  if (!matches) return;

  let total = 0;

  for (const match of matches) {
    // Finds the first of these letters
    const validMatch = /(w|d|h|m|s)/.exec(match);
    // if none of them were found cancel
    if (!validMatch) return;
    // Get the number which should be before the index of that match
    const number = match.substring(0, validMatch.index);
    // Get the letter that was found
    const [letter] = validMatch;
    if (!number || !letter) return;

    let multiplier = Milliseconds.SECOND;
    switch (letter.toLowerCase()) {
      case `w`:
        multiplier = Milliseconds.WEEK;
        break;
      case `d`:
        multiplier = Milliseconds.DAY;
        break;
      case `h`:
        multiplier = Milliseconds.HOUR;
        break;
      case `m`:
        multiplier = Milliseconds.MINUTE;
        break;
    }

    const amount = number ? parseInt(number, 10) : undefined;
    if (!amount) return;

    total += amount * multiplier;
  }

  return total;
}

export function createCommand<T extends readonly ArgumentDefinition[]>(command: Command<T>) {
  (command.botChannelPermissions = [
    "ADD_REACTIONS",
    "USE_EXTERNAL_EMOJIS",
    "READ_MESSAGE_HISTORY",
    "VIEW_CHANNEL",
    "SEND_MESSAGES",
    "EMBED_LINKS",
    ...(command.botChannelPermissions ?? []),
  ]),
    bot.commands.set(command.name, command);
}

export function createSubcommand<T extends readonly ArgumentDefinition[]>(
  commandName: string,
  subcommand: Command<T>,
  retries = 0
) {
  const names = commandName.split("-");

  let command: Command<T> = bot.commands.get(commandName)!;

  if (names.length > 1) {
    for (const name of names) {
      const validCommand = command ? command.subcommands?.get(name) : bot.commands.get(name);

      if (!validCommand) {
        if (retries === 20) break;
        setTimeout(() => createSubcommand(commandName, subcommand, retries++), Milliseconds.SECOND * 10);
        return;
      }

      command = validCommand;
    }
  }

  if (!command) {
    // If 10 minutes have passed something must have been wrong
    if (retries === 20) {
      return log.warn(`Subcommand ${subcommand} unable to be created for ${commandName}`);
    }

    // Try again in 10 seconds in case this command file just has not been loaded yet.
    setTimeout(() => createSubcommand(commandName, subcommand, retries++), Milliseconds.SECOND * 10);
    return;
  }

  if (!command.subcommands) {
    command.subcommands = new Collection();
  }

  // log.debug("Creating subcommand", command.name, subcommand.name);
  command.subcommands.set(subcommand.name, subcommand);
}

// export function createSubcommand(
//   commandName: string,
//   subcommand: Command,
//   retries = 0,
// ) {
//   const names = commandName.split("-");

//   let command = bot.commands.get(commandName);

//   if (names.length > 1) {
//     for (const name of names) {
//       const validCommand = command
//         ? command.subcommands?.get(name)
//         : bot.commands.get(name);
//       if (!validCommand) break;

//       command = validCommand;
//     }
//   }

//   if (!command) {
//     // If 10 minutes have passed something must have been wrong
//     if (retries === 600) {
//       return log.error(
//         `Subcommand ${subcommand} unable to be created for ${commandName}`,
//       );
//     }

//     // Try again in 3 seconds in case this command file just has not been loaded yet.
//     setTimeout(
//       () => createSubcommand(commandName, subcommand, retries++),
//       1000,
//     );
//     return;
//   }

//   if (!command.subcommands) {
//     command.subcommands = new Collection();
//   }

//   command.subcommands.set(subcommand.name, subcommand);
// }

/** Use this function to send an embed with ease. */
export function sendEmbed(channelId: bigint, embed: Embed, content?: string) {
  return sendMessage(channelId, { content, embed });
}

/** Use this function to edit an embed with ease. */
export function editEmbed(message: DiscordenoMessage, embed: Embed, content?: string) {
  return editMessage(message.channelId, message.id, { content, embed });
}

// Very important to make sure files are reloaded properly
let uniqueFilePathCounter = 0;
let paths: string[] = [];

/** This function allows reading all files in a folder. Useful for loading/reloading commands, monitors etc */
export async function importDirectory(path: string) {
  path = path.replaceAll("\\", "/");
  const files = Deno.readDirSync(Deno.realPathSync(path));
  const folder = path.substring(path.indexOf("/src/") + 5);

  if (!folder.includes("/")) log.info(`Loading ${folder}...`);

  for (const file of files) {
    if (!file.name) continue;

    const currentPath = `${path}/${file.name}`;
    if (file.isFile) {
      if (!currentPath.endsWith(".ts")) continue;
      paths.push(
        `import "${Deno.mainModule.substring(0, Deno.mainModule.lastIndexOf("/"))}/${currentPath.substring(
          currentPath.indexOf("src/")
        )}#${uniqueFilePathCounter}";`
      );
      continue;
    }

    await importDirectory(currentPath);
  }

  uniqueFilePathCounter++;
}

/** Imports all everything in fileloader.ts */
export async function fileLoader() {
  await Deno.writeTextFile("fileloader.ts", paths.join("\n").replaceAll("\\", "/"));
  await import(
    `${Deno.mainModule.substring(0, Deno.mainModule.lastIndexOf("/"))}/fileloader.ts#${uniqueFilePathCounter}`
  );
  paths = [];
}

export function getTime() {
  const now = new Date();
  const hours = now.getHours();
  const minute = now.getMinutes();

  let hour = hours;
  let amOrPm = `AM`;
  if (hour > 12) {
    amOrPm = `PM`;
    hour = hour - 12;
  }

  return `${hour >= 10 ? hour : `0${hour}`}:${minute >= 10 ? minute : `0${minute}`} ${amOrPm}`;
}

export function getCurrentLanguage(guildId: bigint) {
  return bot.guildLanguages.get(guildId) || cache.guilds.get(guildId)?.preferredLocale || "en_US";
}

/** This function allows to create a pagination using embeds and reactions Requires GUILD_MESSAGE_REACTIONS intent **/
export async function createEmbedsPagination(
  channelId: bigint,
  authorId: bigint,
  embeds: Embed[],
  defaultPage = 1,
  reactionTimeout = Milliseconds.SECOND * 30,
  reactions: {
    [emoji: string]: (
      setPage: (newPage: number) => void,
      currentPage: number,
      pageCount: number,
      deletePagination: () => void
    ) => Promise<unknown>;
  } = {
    // deno-lint-ignore require-await
    "◀️": async (setPage, currentPage) => setPage(Math.max(currentPage - 1, 1)),
    "↗️": async (setPage) => {
      const question = await sendMessage(
        channelId,
        "To what page would you like to jump? Say `cancel` or `0` to cancel the prompt."
      );
      const answer = await needMessage(authorId, channelId);
      await deleteMessages(channelId, [question.id, answer.id]).catch(log.error);

      const newPageNumber = Math.ceil(Number(answer.content));

      if (isNaN(newPageNumber)) {
        return await sendMessage(channelId, "This is not a valid number!");
      }

      if (newPageNumber < 1 || newPageNumber > embeds.length) {
        return await sendMessage(channelId, `This is not a valid page!`);
      }

      setPage(newPageNumber);
    },
    // deno-lint-ignore require-await
    "▶️": async (setPage, currentPage, pageCount) => setPage(Math.min(currentPage + 1, pageCount)),
    // deno-lint-ignore require-await
    "🗑️": async (_setPage, _currentPage, _pageCount, deletePagination) => deletePagination(),
  }
) {
  if (embeds.length === 0) return;

  let currentPage = defaultPage;
  const embedMessage = await sendEmbed(channelId, embeds[currentPage - 1]);

  if (!embedMessage) return;

  if (embeds.length <= 1) return;

  await embedMessage.addReactions(Object.keys(reactions), true).catch(log.error);

  let isEnded = false;

  while (!isEnded) {
    if (!embedMessage) return;

    const reaction = await needReaction(authorId, embedMessage.id, {
      duration: reactionTimeout,
    });
    if (!reaction) return;

    if (embedMessage.guildId) {
      await removeReaction(embedMessage.channelId, embedMessage.id, reaction, {
        userId: authorId,
      }).catch(log.error);
    }

    if (reactions[reaction]) {
      await reactions[reaction](
        (newPage) => {
          currentPage = newPage;
        },
        currentPage,
        embeds.length,
        async () => {
          isEnded = true;
          await embedMessage.delete().catch(log.error);
        }
      );
    }

    if (isEnded || !embedMessage || !(await editEmbed(embedMessage, embeds[currentPage - 1]).catch(log.error))) {
      return;
    }
  }
}

/** This function allows to create a pagination using embeds and buttons. **/
export async function createEmbedsButtonsPagination(
  messageId: bigint,
  channelId: bigint,
  authorId: bigint,
  embeds: Embed[],
  defaultPage = 1,
  buttonTimeout = Milliseconds.SECOND * 30
) {
  if (embeds.length === 0) return;

  let currentPage = defaultPage;

  const createComponents = (): MessageComponents => [
    {
      type: DiscordMessageComponentTypes.ActionRow,
      components: [
        {
          type: DiscordMessageComponentTypes.Button,
          label: "Previous",
          customId: `${messageId}-Previous`,
          style: DiscordButtonStyles.Primary,
          disabled: currentPage === 1,
          emoji: { name: "⬅️" },
        },
        {
          type: DiscordMessageComponentTypes.Button,
          label: "Jump",
          customId: `${messageId}-Jump`,
          style: DiscordButtonStyles.Primary,
          disabled: embeds.length <= 2,
          emoji: { name: "↗️" },
        },
        {
          type: DiscordMessageComponentTypes.Button,
          label: "Next",
          customId: `${messageId}-Next`,
          style: DiscordButtonStyles.Primary,
          disabled: currentPage >= embeds.length,
          emoji: { name: "➡️" },
        },
        {
          type: DiscordMessageComponentTypes.Button,
          label: "Delete",
          customId: `${messageId}-Delete`,
          style: DiscordButtonStyles.Danger,
          emoji: { name: "🗑️" },
        },
      ],
    },
  ];

  const embedMessage = await sendMessage(channelId, {
    embed: embeds[currentPage - 1],
    components: createComponents(),
  });

  if (!embedMessage) return;

  if (embeds.length <= 1) return;

  while (true) {
    const collectedButton = await needButton(authorId, messageId, {
      duration: buttonTimeout,
    });

    if (!collectedButton || !collectedButton.customId.startsWith(messageId.toString())) {
      return;
    }

    const action = collectedButton.customId.split("-")[1];

    switch (action) {
      case "Next":
        currentPage += 1;
        break;
      // deno-lint-ignore no-case-declarations
      case "Jump":
        await sendInteractionResponse(
          snowflakeToBigint(collectedButton.interaction.id),
          collectedButton.interaction.token,
          {
            type: 6,
          }
        );

        const question = await sendMessage(
          channelId,
          "To what page would you like to jump? Say `cancel` or `0` to cancel the prompt."
        );
        const answer = await needMessage(authorId, channelId);
        await deleteMessages(channelId, [question.id, answer.id]).catch(log.error);

        const newPageNumber = Math.ceil(Number(answer.content));

        if (isNaN(newPageNumber) || newPageNumber < 1 || newPageNumber > embeds.length) {
          await sendMessage(channelId, "This is not a valid number!");
          continue;
        }

        currentPage = newPageNumber;

        editWebhookMessage(
          snowflakeToBigint(collectedButton.interaction.applicationId),
          collectedButton.interaction.token,
          {
            messageId: embedMessage.id,
            embeds: [embeds[currentPage - 1]],
            components: createComponents(),
          }
        );

        continue;
      case "Previous":
        currentPage -= 1;
        break;
      case "Delete":
        deleteMessage(channelId, embedMessage.id);
        return;
    }

    if (currentPage < 0) {
      currentPage = 0;
    }

    if (currentPage > embeds.length) {
      currentPage = embeds.length - 1;
    }

    await sendInteractionResponse(
      snowflakeToBigint(collectedButton.interaction.id),
      collectedButton.interaction.token,
      {
        type: 7,
        data: {
          embeds: [embeds[currentPage - 1]],
          components: createComponents(),
        },
      }
    ).catch(log.error);
  }
}

export function emojiUnicode(emoji: Emoji) {
  return emoji.animated || emoji.id ? `<${emoji.animated ? "a" : ""}:${emoji.name}:${emoji.id}>` : emoji.name || "";
}

export async function fetchMember(guildId: bigint, id: bigint | string) {
  const userId =
    typeof id === "string"
      ? id.startsWith("<@")
        ? BigInt(id.substring(id.startsWith("<@!") ? 3 : 2, id.length - 1))
        : BigInt(id)
      : id;

  const guild = cache.guilds.get(guildId);
  if (!guild) return;

  const cachedMember = cache.members.get(userId);
  if (cachedMember) return cachedMember;

  const shardId = calculateShardId(guildId);

  const shard = ws.shards.get(shardId);
  // When gateway is dying
  if (shard?.queueCounter && shard.queueCounter > 110) {
    return getMember(guildId, userId).catch(() => undefined);
  }

  // Fetch from gateway as it is much better than wasting limited HTTP calls.
  const member = await fetchMembers(guildId, shardId, {
    userIds: [userId],
    limit: 1,
  }).catch(() => undefined);

  return member?.first();
}

export function calculateShardId(guildId: bigint) {
  if (ws.maxShards === 1) return 0;

  return Number((guildId >> 22n) % BigInt(ws.maxShards - 1));
}
/** This function should be used when you want to send a response that will send a reply message. */
export async function sendResponse(channelId: bigint, messageId: bigint, content: string | CreateMessage) {
  if (!(await botHasChannelPermissions(channelId, ["VIEW_CHANNEL", "SEND_MESSAGES", "READ_MESSAGE_HISTORY"]))) {
    return;
  }

  const contentWithMention: CreateMessage =
    typeof content === "string"
      ? {
          content,
          allowedMentions: {
            repliedUser: true,
          },
          messageReference: {
            messageId: bigintToSnowflake(messageId),
            failIfNotExists: false,
          },
        }
      : {
          ...content,
          allowedMentions: {
            ...(content.allowedMentions || {}),
            repliedUser: true,
          },
          messageReference: {
            messageId: bigintToSnowflake(messageId),
            failIfNotExists: content.messageReference?.failIfNotExists === true,
          },
        };

  return await sendMessage(channelId, contentWithMention).catch(log.warn);
}
export async function createInteractionDatabaseButtonPagination(
  interaction: Omit<Interaction, "member">,
  member: DiscordenoMember,
  getEmbedCount: () => Promise<number>,
  getNoneEmbed: () => Promise<Embed | undefined>,
  getEmbed: (embedPage: number, max_page: number) => Promise<Embed>,
  page = 1
): Promise<void> {
  await sendInteractionResponse(snowflakeToBigint(interaction.id), interaction.token, {
    type: DiscordInteractionResponseTypes.DeferredChannelMessageWithSource,
  }).catch(log.warn);

  let currentPage = page;

  const createComponents = async (): Promise<MessageComponents> => [
    {
      type: DiscordMessageComponentTypes.ActionRow,
      components: [
        {
          type: DiscordMessageComponentTypes.Button,
          label: "Previous",
          customId: `${interaction.id}-Previous`,
          style: DiscordButtonStyles.Primary,
          disabled: currentPage === 1,
        },
        {
          type: DiscordMessageComponentTypes.Button,
          label: "Jump",
          customId: `${interaction.id}-Jump`,
          style: DiscordButtonStyles.Primary,
          disabled: (await getEmbedCount()) <= 2,
        },
        {
          type: DiscordMessageComponentTypes.Button,
          label: "Next",
          customId: `${interaction.id}-Next`,
          style: DiscordButtonStyles.Primary,
          disabled: currentPage >= (await getEmbedCount()),
        },
      ],
    },
  ];

  const embedCount = Number(await getEmbedCount());
  if (embedCount === 0) {
    const noneEmbed = await getNoneEmbed();
    if (noneEmbed) {
      await editSlashResponse(interaction.token, {
        embeds: [noneEmbed],
      }).catch(log.warn);
    }
    return;
  }
  if (page > embedCount) {
    return;
  }

  const currentEmbed = await getEmbed(currentPage, embedCount);
  await editSlashResponse(interaction.token, {
    embeds: [currentEmbed],
    components: await createComponents(),
  }).catch(log.warn);

  if (embedCount === 1) {
    return;
  }

  while (true) {
    const collectedButton = await needButton(member.id, snowflakeToBigint(interaction.id), {
      duration: 30 * 1000,
    }).catch(log.error);

    if (!collectedButton || !collectedButton.customId.startsWith(interaction.id.toString())) {
      return;
    }

    const action = collectedButton.customId.split("-")[1];

    switch (action) {
      case "Next":
        currentPage++;
        break;
      // deno-lint-ignore no-case-declarations
      case "Jump":
        await sendInteractionResponse(
          snowflakeToBigint(collectedButton.interaction.id),
          collectedButton.interaction.token,
          {
            type: DiscordInteractionResponseTypes.ChannelMessageWithSource,
            data: {
              content: "To what page would you like to jump? Say `cancel` or `0` to cancel the prompt.",
            },
          }
        ).catch(log.warn);

        const answer = await needMessage(member.id, snowflakeToBigint(interaction.channelId!));
        await deleteMessage(snowflakeToBigint(interaction.channelId!), answer.id).catch(log.error);
        await deleteSlashResponse(collectedButton.interaction.token);

        const newPageNumber = Math.ceil(Number(answer.content));

        if (isNaN(newPageNumber) || newPageNumber < 1 || newPageNumber > embedCount) {
          continue;
        }

        currentPage = newPageNumber;

        editSlashResponse(interaction.token, {
          embeds: [await getEmbed(currentPage, embedCount)],
          content: "",
          components: await createComponents(),
        }).catch(log.warn);

        continue;
      case "Previous":
        currentPage--;
        break;
    }

    if (currentPage < 1) {
      currentPage = 1;
    }

    if (currentPage > embedCount) {
      currentPage = embedCount;
    }

    await sendInteractionResponse(
      snowflakeToBigint(collectedButton.interaction.id),
      collectedButton.interaction.token,
      {
        type: 7,
        data: {
          embeds: [await getEmbed(currentPage, embedCount)],
          content: "",
          components: await createComponents(),
        },
      }
    ).catch(log.warn);
  }
}
//Create a DataBase with buttons Message Only.
export async function createDatabasePagination(
  message: DiscordenoMessage,
  getEmbedCount: () => Promise<number>,
  getNoneEmbed: () => Promise<Embed | undefined>,
  getEmbed: (embedPage: number, max_page: number) => Promise<Embed>,
  page = 1
): Promise<void> {
  const embedCount = Number(await getEmbedCount());

  if (embedCount === 0) {
    const noneEmbed = await getNoneEmbed();
    if (noneEmbed) {
      await sendEmbed(message.channelId, noneEmbed);
    }
    return;
  }
  if (page > embedCount) {
    return;
  }

  const createComponents = async (): Promise<MessageComponents> => [
    {
      type: DiscordMessageComponentTypes.ActionRow,
      components: [
        {
          type: DiscordMessageComponentTypes.Button,
          label: "Previous",
          customId: `${message.id}-Previous`,
          style: DiscordButtonStyles.Primary,
          disabled: currentPage === 1,
        },
        {
          type: DiscordMessageComponentTypes.Button,
          label: "Jump",
          customId: `${message.id}-Jump`,
          style: DiscordButtonStyles.Primary,
          disabled: (await getEmbedCount()) <= 2,
        },
        {
          type: DiscordMessageComponentTypes.Button,
          label: "Next",
          customId: `${message.id}-Next`,
          style: DiscordButtonStyles.Primary,
          disabled: currentPage >= (await getEmbedCount()),
        },
      ],
    },
  ];

  const { channelId } = message;
  let currentPage = page;
  const currentEmbed = await getEmbed(currentPage, embedCount);
  //deno-lint-ignore prefer-const
  let currentEmbedMessage: DiscordenoMessage | void = await sendMessage(channelId, {
    embed: currentEmbed,
    components: await createComponents(),
  });

  if (!currentEmbedMessage || embedCount === 1) {
    return;
  }

  while (true) {
    if (!currentEmbedMessage) {
      return;
    }
    const collectedButton = await needButton(message.authorId, message.id, {
      duration: 30 * 1000,
    }).catch(log.error);

    if (!collectedButton || !collectedButton.customId.startsWith(message.id.toString())) {
      return;
    }

    const action = collectedButton.customId.split("-")[1];

    switch (action) {
      case "Next":
        currentPage++;
        break;
      //deno-lint-ignore no-case-declarations
      case "Jump":
        await sendInteractionResponse(
          snowflakeToBigint(collectedButton.interaction.id),
          collectedButton.interaction.token,
          {
            type: 6,
          }
        );

        const question = await sendResponse(
          message.channelId,
          message.id,
          "To what page would you like to jump? Say `cancel` or `0` to cancel the prompt."
        );
        if (!question) return;
        const answer = await needMessage(message.authorId, message.channelId);
        if (!answer) return;
        await deleteMessages(message.channelId, [answer.id, question.id]).catch(log.error);

        const newPageNumber = Math.ceil(Number(answer.content));

        if (isNaN(newPageNumber) || newPageNumber < 1 || newPageNumber > embedCount) {
          continue;
        }

        currentPage = newPageNumber;

        editWebhookMessage(
          snowflakeToBigint(collectedButton.interaction.applicationId),
          collectedButton.interaction.token,
          {
            messageId: currentEmbedMessage.id,
            embeds: [await getEmbed(currentPage, embedCount)],
            components: await createComponents(),
          }
        );

        continue;
      case "Previous":
        currentPage--;
        break;
    }

    if (currentPage < 1) {
      currentPage = 1;
    }

    if (currentPage > embedCount) {
      currentPage = embedCount;
    }

    await sendInteractionResponse(
      snowflakeToBigint(collectedButton.interaction.id),
      collectedButton.interaction.token,
      {
        type: 7,
        data: {
          embeds: [await getEmbed(currentPage, embedCount)],
          components: await createComponents(),
        },
      }
    ).catch(log.error);
  }
}
interface customPaginationSchema extends Record<string, unknown> {
  messageId: bigint;
  QueryObject: (usercardinventory & globalcardlist)[];
}
//Create a DataBase with buttons Message Only (For Use With CardCombination Command).
export async function createCustomDataPagination(
  message: DiscordenoMessage,
  getEmbedCount: () => Promise<number>,
  getNoneEmbed: () => Promise<Embed | undefined>,
  getEmbed: (embedPage: number, max_page: number) => Promise<Embed>,
  getQuery: (embedPage: number, max_page: number) => Promise<(usercardinventory & globalcardlist)[]>,
  page = 1
): Promise<customPaginationSchema | void> {
  const embedCount = Number(await getEmbedCount());

  if (embedCount === 0) {
    const noneEmbed = await getNoneEmbed();
    if (noneEmbed) {
      await sendEmbed(message.channelId, noneEmbed);
    }
    return;
  }
  if (page > embedCount) {
    return;
  }

  const createComponents = async (): Promise<MessageComponents> => [
    {
      type: DiscordMessageComponentTypes.ActionRow,
      components: [
        {
          type: DiscordMessageComponentTypes.Button,
          label: "Previous",
          customId: `${message.id}-Previous`,
          style: DiscordButtonStyles.Primary,
          disabled: currentPage === 1,
        },
        {
          type: DiscordMessageComponentTypes.Button,
          label: "Next",
          customId: `${message.id}-Next`,
          style: DiscordButtonStyles.Primary,
          disabled: currentPage >= (await getEmbedCount()),
        },
        {
          type: DiscordMessageComponentTypes.Button,
          label: `Select`,
          customId: `${message.id}-Select`,
          style: DiscordButtonStyles.Primary,
        },
      ],
    },
  ];

  const { channelId } = message;
  let currentPage = page;
  const currentEmbed = await getEmbed(currentPage, embedCount);
  const currentData = await getQuery(currentPage, embedCount);
  //deno-lint-ignore prefer-const
  let currentEmbedMessage: DiscordenoMessage | void = await sendMessage(channelId, {
    embed: currentEmbed,
    components: await createComponents(),
  });

  if (!currentEmbedMessage || embedCount === 1) {
    return { messageId: currentEmbedMessage.id, QueryObject: currentData };
  }

  while (true) {
    if (!currentEmbedMessage) {
      return;
    }
    const collectedButton = await needButton(message.authorId, message.id, {
      duration: 30 * 1000,
    }).catch(log.error);

    if (!collectedButton || !collectedButton.customId.startsWith(message.id.toString())) {
      return { messageId: currentEmbedMessage.id, QueryObject: currentData };
    }

    const action = collectedButton.customId.split("-")[1];

    switch (action) {
      case "Next":
        currentPage++;
        break;
      case "Select":
        console.log("Button Pressed, Data Probably Sent.");
        return { messageId: currentEmbedMessage.id, QueryObject: currentData };
      case "Previous":
        currentPage--;
        break;
    }

    if (currentPage < 1) {
      currentPage = 1;
    }

    if (currentPage > embedCount) {
      currentPage = embedCount;
    }

    await sendInteractionResponse(
      snowflakeToBigint(collectedButton.interaction.id),
      collectedButton.interaction.token,
      {
        type: 7,
        data: {
          embeds: [await getEmbed(currentPage, embedCount)],
          components: await createComponents(),
        },
      }
    ).catch(log.error);
  }
}
// Length starts from the index
export function shortenString(text: string, length: number, startIndex = 0): string {
  if (startIndex + text.length < length) return text;
  return text.substr(startIndex, startIndex + length);
}
import { SelectOption } from "../../deps.ts";
import { SelectMenu } from "./components.ts";

export type addables = SelectMenu;

export type emoji =
  | string
  | {
      id?: string;
      name?: string;
      animated?: boolean;
    };

export interface addableSelectMenuOption extends Omit<SelectOption, "default"> {
  default?: boolean;
}
interface customPaginationSchemaChests extends Record<string, unknown> {
  messageId: bigint;
  QueryObject: chestinventoryschema[];
}
export async function createCustomDataPaginationChests(
  message: DiscordenoMessage,
  getEmbedCount: () => Promise<number>,
  getNoneEmbed: () => Promise<Embed | undefined>,
  getEmbed: (embedPage: number, max_page: number) => Promise<Embed>,
  getQuery: (embedPage: number, max_page: number) => Promise<chestinventoryschema[]>,
  page = 1
): Promise<customPaginationSchemaChests | void> {
  const embedCount = Number(await getEmbedCount());

  if (embedCount === 0) {
    const noneEmbed = await getNoneEmbed();
    if (noneEmbed) {
      await sendEmbed(message.channelId, noneEmbed);
    }
    return;
  }
  if (page > embedCount) {
    return;
  }

  const createComponents = async (): Promise<MessageComponents> => [
    {
      type: DiscordMessageComponentTypes.ActionRow,
      components: [
        {
          type: DiscordMessageComponentTypes.Button,
          label: "Previous",
          customId: `${message.id}-Previous`,
          style: DiscordButtonStyles.Primary,
          disabled: currentPage === 1,
        },
        {
          type: DiscordMessageComponentTypes.Button,
          label: "Next",
          customId: `${message.id}-Next`,
          style: DiscordButtonStyles.Primary,
          disabled: currentPage >= (await getEmbedCount()),
        },
        {
          type: DiscordMessageComponentTypes.Button,
          label: `Select`,
          customId: `${message.id}-Select`,
          style: DiscordButtonStyles.Primary,
        },
      ],
    },
  ];

  const { channelId } = message;
  let currentPage = page;
  const currentEmbed = await getEmbed(currentPage, embedCount);
  const currentData = await getQuery(currentPage, embedCount);
  //deno-lint-ignore prefer-const
  let currentEmbedMessage: DiscordenoMessage | void = await sendMessage(channelId, {
    embed: currentEmbed,
    components: await createComponents(),
  });

  if (!currentEmbedMessage || embedCount === 1) {
    return { messageId: currentEmbedMessage.id, QueryObject: currentData };
  }

  while (true) {
    if (!currentEmbedMessage) {
      return;
    }
    const collectedButton = await needButton(message.authorId, message.id, {
      duration: 30 * 1000,
    }).catch(log.error);

    if (!collectedButton || !collectedButton.customId.startsWith(message.id.toString())) {
      return { messageId: currentEmbedMessage.id, QueryObject: currentData };
    }

    const action = collectedButton.customId.split("-")[1];

    switch (action) {
      case "Next":
        currentPage++;
        break;
      case "Select":
        console.log("Button Pressed, Data Probably Sent.");
        return { messageId: currentEmbedMessage.id, QueryObject: currentData };
      case "Previous":
        currentPage--;
        break;
    }

    if (currentPage < 1) {
      currentPage = 1;
    }

    if (currentPage > embedCount) {
      currentPage = embedCount;
    }

    await sendInteractionResponse(
      snowflakeToBigint(collectedButton.interaction.id),
      collectedButton.interaction.token,
      {
        type: 7,
        data: {
          embeds: [await getEmbed(currentPage, embedCount)],
          components: await createComponents(),
        },
      }
    ).catch(log.error);
  }
}
