export interface ClientSchema {
  /** The bot id */
  id: string;
}
interface candidate {
  id: string;
  votes: number;
}
export interface VoteSchema {
  candidate1: candidate;
  candidate2: candidate;
  candidate3: candidate;
}

export interface GuildSchema {
  /** The guild id */
  id: string;
  /** The custom prefix for this guild */
  prefix?: string;
  /** The language for this guild */
  language?: string;
  /** The Rules message id for this guild */
  rulesid: string;
  /** The channel the tasks aka polls will be running in. */
  pollsid: string;
  /**Leader ID*/
  leaderid?: string;
}

export interface UserSchema {
  /**The user sending the message */
  id: string;
  /** Amount of messages the person has sent during the week. */
  messages: number;
}
