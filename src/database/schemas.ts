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
  /**XP To convert to level */
  xp: number;
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
  //How many Points you currently have to add to your current stats.
  statpoints: number;
  //How many points you had your entire game career.
  totalpoints: number;
  //Daily Shop ID
  dailyshopid?: number;
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

export interface globalcardlist extends Record<string, unknown> {
  //**Card ID */
  id?: number;
  //**Card Name */
  name: string;
  //**Card Level */
  level?: number;
  //**Attack Damage */
  attack: number;
  //**How tanky */
  defence: number;
  //**If the amount of speed is faster than the enemies cards, move first. */
  speed: number;
  //**Magic Damage */
  magic: number;
  //**ImageURL of the card. */
  imagelink: string;
  //**Describe the card, Where is it from/Explain the meme. */
  description: string;
  //**How hard is it to find? */
  rarity: number;
  //**Type of Card. */
  type: string;
}

export interface usercardinventory extends Record<string, unknown> {
  //**Id of the card */
  id: number;
  //**Id of the user who owns this card. */
  userid: bigint;
  //**level of the card. */
  level: number;
  //**Unique Card ID. */
  cardnumber: number;
  //**If the card is in userdeck or not */
  isindeck: boolean;
}

export interface enemyuserschema extends Record<string, unknown> {
  id: number;
  name: string;
  image: string;
  type: "attack" | "tank" | "speed" | "magic";
  description: string;
}
export interface enemyuserstats extends Record<string, unknown> {
  health: number;
  basicattack: number;
  abilitypower: number;
  speed: number;
  defence: number;
}
export interface enemyEntitySchema extends Record<string, unknown> {
  enemyTemplate: enemyuserschema;
  level: number;
  enemyHealth: number;
  enemycards: Array<number>;
  enemystats: enemyuserstats;
}
export interface dailyshop extends Record<string, unknown> {
  shopid: number;
  cards: Array<number>;
  luck: number;
}
export interface fightschema extends Record<string, unknown> {
  level: number;
  userstats: enemyuserstats;
  userhealth: number;
  usercards: Array<number>;
  enemyuser: enemyEntitySchema;
  enemyhealth: number;
  enemycards: Array<number>;
}
export interface deckschema extends Record<string, unknown> {
  userid: bigint;
  card1: number | 0;
  card2: number | 0;
  card3: number | 0;
  card4: number | 0;
  card5: number | 0;
}

export interface chestinventoryschema extends Record<string, unknown> {
  chestid: number;
  userid: bigint;
  chestlevel: number;
}
