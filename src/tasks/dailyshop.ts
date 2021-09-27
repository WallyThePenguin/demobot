import { Milliseconds } from "../utils/constants/time.ts";
import { cache } from "../../deps.ts";
import { bot } from "../../cache.ts";
import { dailyshopreset } from "../database/client.ts";

bot.tasks.set(`dailyshop`, {
  name: `dailyshop`,
  // Runs this function once every 6 minutes. (1 minute for testing)
  interval: Milliseconds.MINUTE * 3,
  disabled: true,
  execute: async function () {
    // Only run when the bot is fully ready. In case guilds are still loading dont want to send wrong stats.
    if (!cache.isReady) return;
    //const today = new Date();
    const poo = 1;
    // today.getHours() === 17 && today.getMinutes() <= 10
    if (poo == 1) {
      await dailyshopreset().catch(console.error);
      return;
    } else {
      return;
    }
  },
});
