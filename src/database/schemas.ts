export interface ClientSchema {
  /** The bot id */
  id: string;
}
interface candidate {
  //**Candidate UserId */
  id?: string;
  //**Number of Votes they have gotten. */
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
interface stats {
  //**Amount of health you have */
  Health: number;
  //**Amount of Attack Dmg you have */
  Basicattack?: number;
  //**Amount of Ability Power you have */
  Abilitypower?: number;
  //**Amount of Speed, if you get to move first or not */
  Speed: number;
  //**Amount Of Luck you have (For Drops) */
  Luck?: number;
  //**For Strategists */
  Chance?: number;
  //**CritChance, basically chanceroll for extra dmg. */
  CritChance: number;
  //**How big of a multiplier you get when you land crit. */
  CritDmgMultiplier: number;
  //**Defense, Basically Going to subtract from attack dmg when getting hit. */
  Defense: number;
}
interface money {
  name: string;
  moneycount: number;
}
export interface EconUserSchema {
  /**UserId */
  id: string;
  //**Money */
  money: money;
  //**StatSchema */
  stats: stats;
  //**Adventure count you went on */
  Adventurecount: number;
}

export interface adventure {
  //**Endless */
  EndlessPVE: boolean;
  //**Number 1-10 for now, difficulty of the fights */
  Difficulty: number;
  //**How many Enemies you will encounter, based on Difficulty. */
  EnemyCount?: number;
  //**Enemy stats, based on difficulty. */
  Enemies: stats;
}
