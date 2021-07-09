export interface VoteSchema extends Record<string, unknown> {
  //**UserID */
  id: bigint;
  //**Number of Votes */
  vote: number;
  //**Unique Candidate ID */
  numID: number;
}

export interface GuildSchema extends Record<string, unknown> {
  /** The guild id */
  guildId: bigint;
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

export interface UserSchema extends Record<string, unknown> {
  /**The user sending the message */
  id: bigint;
  /** Amount of messages the person has sent during the week. */
  messages: number;
}
export interface GameUserSchema extends Record<string, unknown> {
  /**UserId */
  id: bigint;
  //**Money */
  money: number;
  //**Amount of health you have */
  health?: number;
  //**Amount of Attack Dmg you have */
  basicattack?: number;
  //**Amount of Ability Power you have */
  abilitypower?: number;
  //**Amount of Speed, if you get to move first or not */
  speed?: number;
  //**Amount Of Luck you have (For Drops) */
  luck?: number;
  //**For Strategists */
  chance?: number;
  //**CritChance, basically chanceroll for extra dmg. */
  critchance?: number;
  //**How big of a multiplier you get when you land crit. */
  critdmgmultiplier?: number;
  //**Defense, Basically Going to subtract from attack dmg when getting hit. */
  defense?: number;
  //**Whether or not game messages sent to dms. */
  dm?: boolean;
}
export interface CardUserSchema extends Record<string, unknown> {
  //**DiscordUserId */
  id: bigint;
  //**Card Inventory of the user */
  cards: [];
  //**Deck of a user for a fight */
  deck: [];
}
export interface Arena extends Record<string, unknown> {
  //**UserID to Distinguish between Arena instances */
  id: bigint;
  //**Endless */
  endlesspve: boolean;
  //**Number 1-10 for now, difficulty of the fights */
  difficulty: number;
  //**How many Enemies you will encounter, based on Difficulty. */
  enemycount?: number;
}
