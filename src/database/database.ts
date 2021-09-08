import { runQuery } from "./client.ts";
import * as schemas from "./schemas.ts";
import { bot } from "./../../cache.ts";
import { configs } from "./../../configs.ts";

/** Create needed tables */
async function createTables() {
  const queries = [
    `CREATE TABLE IF NOT EXISTS public."Arena"
  (
      id bigint NOT NULL,
      endlesspve boolean NOT NULL,
      difficulty integer NOT NULL,
      enemycount integer,
      CONSTRAINT "Arena_pkey" PRIMARY KEY (id)
  )`,
    `CREATE TABLE IF NOT EXISTS public."GameUserSchema"
  (
      id bigint NOT NULL,
      money integer NOT NULL,
      health integer,
      basicattack integer,
      abilitypower integer,
      speed integer,
      luck integer,
      chance integer,
      critchance integer,
      critdmgmultiplier integer,
      defense integer,
      xp integer,
      statpoints integer,
      totalpoints integer,
      CONSTRAINT "GameUserSchema_pkey" PRIMARY KEY (id)
  )`,
    `CREATE TABLE IF NOT EXISTS public."GuildSchema"
      (
          "guildId" bigint NOT NULL,
          prefix text COLLATE pg_catalog."default",
          language text COLLATE pg_catalog."default",
          rulesid text COLLATE pg_catalog."default" NOT NULL,
          pollsid text COLLATE pg_catalog."default" NOT NULL,
          leaderid text COLLATE pg_catalog."default",
          CONSTRAINT "GuildSchema_pkey" PRIMARY KEY ("guildId")
      )`,
    `CREATE TABLE IF NOT EXISTS public."UserSchema"
      (
          id bigint NOT NULL,
          messages integer NOT NULL,
          CONSTRAINT "UserSchema_pkey" PRIMARY KEY (id)
      )`,
    `CREATE TABLE IF NOT EXISTS public."VoteSchema"
    (
        id bigint NOT NULL,
        vote integer NOT NULL,
        "numID" integer NOT NULL,
        CONSTRAINT "VoteSchema_pkey" PRIMARY KEY ("numID", id)
    )`,
    `CREATE TABLE IF NOT EXISTS public.globalcardlist
    (
        id integer NOT NULL DEFAULT nextval('globalcardlist_id_seq'::regclass),
        name text COLLATE pg_catalog."default" NOT NULL,
        level integer NOT NULL,
        attack integer NOT NULL,
        defence integer NOT NULL,
        speed integer NOT NULL,
        imagelink text COLLATE pg_catalog."default" NOT NULL,
        description text COLLATE pg_catalog."default" NOT NULL,
        rarity integer NOT NULL,
        type text COLLATE pg_catalog."default" NOT NULL,
        magic integer NOT NULL,
        CONSTRAINT globalcardlist_pkey PRIMARY KEY (id)
    )
    `,
    `CREATE TABLE IF NOT EXISTS public.usercardinventory
    (
        id integer NOT NULL,
        userid bigint NOT NULL,
        level integer NOT NULL,
        cardnumber integer NOT NULL DEFAULT nextval('usercardinventory_cardnumber_seq'::regclass),
        isindeck boolean NOT NULL,
        CONSTRAINT usercardinventory_pkey PRIMARY KEY (cardnumber),
        CONSTRAINT uniqueinventory UNIQUE (id, userid, level, cardnumber),
        CONSTRAINT inventory FOREIGN KEY (id)
            REFERENCES public.globalcardlist (id) MATCH SIMPLE
            ON UPDATE CASCADE
            ON DELETE CASCADE
            NOT VALID
    )`,
    `CREATE INDEX IF NOT EXISTS isindeck
    ON public.usercardinventory USING btree
    (isindeck ASC NULLS LAST)`,
    `CREATE TABLE IF NOT EXISTS public.enemyuserschema
    (
        id integer NOT NULL DEFAULT nextval('enemyuserschema_id_seq'::regclass),
        name text COLLATE pg_catalog."default" NOT NULL,
        image text COLLATE pg_catalog."default" NOT NULL,
        type text COLLATE pg_catalog."default" NOT NULL,
        description text COLLATE pg_catalog."default" NOT NULL,
        CONSTRAINT enemyuserschema_pkey PRIMARY KEY (id)
    )`,
  ];

  for (const query of queries) {
    await runQuery(query).catch((err) => {
      throw new Error(`Failed to create table with query: ${query}\nerror: ${err.message}`);
    });
  }
}
async function loadCache() {
  // Guilds
  const guilds = await runQuery<schemas.GuildSchema>(`SELECT * FROM "GuildSchema"`);
  guilds.forEach((guild) => {
    if (guild.language) bot.guildLanguages.set(guild.guildId, guild.language);
    if (guild.prefix && guild.prefix !== configs.prefix) bot.guildPrefixes.set(guild.guildId, guild.prefix);
  });
}
/** Test connection to the database */
async function testConnection() {
  const test = await runQuery("select 6*9 as test;");
  if (test.length == 0 || test[0].test !== 54) throw new Error("Database connection verification failed.");
}
export async function init() {
  await testConnection();
  await createTables();
  await loadCache();
}
