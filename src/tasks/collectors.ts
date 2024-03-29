// This task will help remove un-used collectors to help keep our cache optimized.
import { bot } from "../../cache.ts";
import { Milliseconds } from "../utils/constants/time.ts";

bot.tasks.set(`collectors`, {
  name: `collectors`,
  // Runs this function once a minute
  interval: Milliseconds.MINUTE,
  log: false,
  execute: function () {
    const now = Date.now();

    bot.messageCollectors.forEach((collector, key) => {
      // This collector has not finished yet.
      if (collector.createdAt + collector.duration > now) return;

      // Remove the collector
      bot.messageCollectors.delete(key);
      // Reject the promise so code can continue in commands.
      return collector.reject("User did not send a message in time.");
    });

    bot.reactionCollectors.forEach((collector, key) => {
      // This collector has not finished yet.
      if (collector.createdAt + collector.duration > now) return;

      // Remove the collector
      bot.reactionCollectors.delete(key);
      // Reject the promise so code can continue in commands.
      return collector.reject("User did not react in time.");
    });

    bot.buttonCollectors.forEach((collector, key) => {
      // This collector has not finished yet.
      if (collector.createdAt + collector.duration > now) return;

      // Remove the collector
      bot.buttonCollectors.delete(key);
      // Reject the promise so code can continue in commands.
      return collector.reject("The button was not pressed in time.");
    });
  },
});
