import { configs } from "./configs.ts";
import { cache, Collection, DiscordenoMessage, Manager, snowflakeToBigint, Track, ws } from "./deps.ts";
import { ButtonCollector, MessageCollector, ReactionCollector, collector } from "./src/types/collectors.ts";
import { Argument, Command, PermissionLevels } from "./src/types/commands.ts";
import { CustomEvents } from "./src/types/events.ts";
import { Monitor } from "./src/types/monitors.ts";
import { Task } from "./src/types/tasks.ts";
import { interactionListener } from "./src/types/listeners/interactionListener.ts";
import { fightschema } from "./src/database/schemas.ts";
export const bot = {
  fullyReady: false,
  activeGuildIDs: new Set<bigint>(),
  dispatchedGuildIDs: new Set<bigint>(),
  dispatchedChannelIDs: new Set<bigint>(),
  arguments: new Collection<string, Argument>(),
  // deno-lint-ignore no-explicit-any
  commands: new Collection<string, Command<any>>(),
  eventHandlers: {} as CustomEvents,
  guildPrefixes: new Collection<bigint, string>(),
  guildLanguages: new Collection<bigint, string>(),
  messageCollectors: new Collection<bigint, MessageCollector>(),
  reactionCollectors: new Collection<bigint, ReactionCollector>(),
  interactionListeners: new Collection<string, interactionListener>(),
  buttonCollectors: new Collection<bigint, ButtonCollector>(),
  inhibitors: new Collection<
    string,
    (
      message: DiscordenoMessage,
      // deno-lint-ignore no-explicit-any
      command: Command<any>
    ) => Promise<boolean> | boolean
  >(),
  monitors: new Collection<string, Monitor>(),
  permissionLevels: new Collection<
    PermissionLevels,
    (
      message: DiscordenoMessage,
      // deno-lint-ignore no-explicit-any
      command: Command<any>
    ) => Promise<boolean> | boolean
  >(),
  tasks: new Collection<string, Task>(),
  runningTasks: { initialTimeouts: [] as number[], intervals: [] as number[] },
  memberLastActive: new Collection<bigint, number>(),
  musicQueues: new Collection<bigint, Track[]>(),
  loopingMusics: new Collection<bigint, boolean>(),
  componentCollectors: new Collection<bigint, collector>(),
  lavadenoManager: new Manager(configs.nodes, {
    send(id, payload) {
      const shardId = cache.guilds.get(snowflakeToBigint(id))?.shardId;
      if (shardId === undefined) return;

      ws.sendShardMessage(shardId, payload);
    },
  }),
  fightCache: new Map<bigint, fightschema>(),
  unfinishedFightsCache: new Map<bigint, fightschema>(),
};
