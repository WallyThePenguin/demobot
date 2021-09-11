import { DiscordenoMember, Interaction } from "../../../deps.ts";

export type interactionListener = {
  execute: (data: Interaction, member?: DiscordenoMember) => unknown;
  filter?: interactionListenerFilter;
};

export type interactionListenerFilter = (data: Interaction, member?: DiscordenoMember) => boolean;
