import { bot } from "../../../cache.ts";
import * as deps from "../../../deps.ts";
import { runQuery } from "../../database/client.ts";
import * as schemas from "../../database/schemas.ts";
import * as I18NEXT from "../../utils/i18next.ts";
import { PermissionLevels } from "../../types/commands.ts";
import { Embed } from "../../utils/Embed.ts";
import { createCommand } from "../../utils/helpers.ts";

createCommand({
  name: "eval",
  permissionLevels: [PermissionLevels.BOT_OWNER],
  arguments: [
    {
      name: "async",
      type: "string",
      literals: ["async"],
      required: false,
    },
    {
      name: "code",
      type: "...strings",
    },
  ] as const,
  execute: async (message, args) => {
    //#region  imports
    const cache = deps.cache;
    const _imports = {
      bot,
      cache,
      deps,
      runQuery,
      schemas,
      I18NEXT,
    };
    //#endregion

    let result, type, errorTriggered;
    try {
      result = args.async ? eval(`(async () => {\n${args.code}\n})();`) : eval(args.code);
      if (typeof result.then === "function") result = await result;
      type = typeof result;
    } catch (error) {
      type = typeof error;
      result = error;
      errorTriggered = true;
    }

    if (type !== "string") result = Deno.inspect(result);
    result = result.replaceAll("```", "'");

    // embed desc max 2048 chars, with formatting stuff max --> 2038
    result.length > 2038 ? (result = result.substring(0, 2034) + "\n...") : result;

    const embed = new Embed()
      .setTitle("Eval")
      .setDescription(["```ts", result, "```"]) // /n - 2, ` - 6, ts - 2 --> 10 characters
      .addField(`Code`, ["```ts", args.code, "```"].join("\n"))
      .addField(`Type`, type);

    if (errorTriggered) embed.setColor("FF0000");

    message.reply({ embed });
  },
});
