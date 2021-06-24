// This command is intentionally done in an un-optimized way. This command is only to show you how to await a users response.
import { sendMessage } from "../../../deps.ts";
import { needMessage } from "../../utils/collectors.ts";
import { Embed } from "./../../utils/Embed.ts";
import { createCommand, sendEmbed } from "./../../utils/helpers.ts";

createCommand({
  name: `start`,
  guildOnly: true,
  execute: async (message) => {},
});
