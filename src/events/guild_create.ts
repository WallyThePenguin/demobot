import { bot } from "../../cache.ts";
import { log } from "../utils/logger.ts";

bot.eventHandlers.guildCreate = function (guild) {
  log.info(
    `[EVENT=GuildCreate]: ${guild.name} ID: ${guild.id} GID: ${guild.systemChannelId} with ${guild.memberCount} members.`
  );
};
