# DemoBot(A Bunch Of Projects)

This is a bunch of projects, currently unfinished, and will turn private when close to finish.
This repo is made from a template which you can use to create a Discord bot very
easily using the [Discordeno library](https://github.com/discordeno/discordeno).

[Website/Guide:](https://discordeno.mod.land/)

[Discord Server](https://discord.com/invite/5vBgXk3UcZ)

## Pre-requisites

- [Deno](https://deno.land)
- [PSQL](https://www.postgresql.org/)
- [ImageScript](https://deno.land/x/imagescript@1.2.9)

## TO DO:

- MAKE TUTORIAL COMMAND ❌(Do basic commands when core game mechanics are finished)

- MAKE XP TO LEVEL CONVERSION FUNCTION✔(xpforlevel, checkLevel)

- MAKE AWARD XP FUNCTION (Easier to give xp in each command)✔(xpchange)

MAKE GLOBAL CARDLIST IN SQL✔

- Make a Table For Cards their attributes they might get, Constant Values Here aswell as nonconstant✔
- Add Table in Code✔
- Add Schema In Code✔

MAKE USER INVENTORY SYSTEM "Card ID array"✔

- Make Table With ID, And Attributes they might get, NON CONSTANT VALUES HERE✔
- Make Relation with GLOBAL CARDLIST✔

MAKE DECK SYSTEM "Card ID array limited"✔

- Make Relation with USER INVENTORY SYSTEM✔
- Find a way to compare, view, and not duplicate cards.✔

MAKE TESTER CARDS✔

IMPLEMENT USER SUGGESTION COMMAND (Introduce ImageScript)🌓(Use Imagescript for card creation instead.)

INTRODUCING IMAGESCRIPT

- MAKE CARD TEMPLATE
- IMPLEMENT CARD TEMPLATE + IMAGE INTO CARD CREATION
- STORE CARD TEMPLATE IN LOCAL FOLDER
- MAKE PROFILE TEMPLATE FOR PROFILE COMMAND
- DISPLAY LEVEL PROGRESS FOR PROFILE COMMAND

FIX TRADINGSTART.ts ✔
FIX POINT TREE ✔

MAKE FIGHTING AUTO-GENERATED ENEMIES FOR ENDLESS ONSLAUGHT/STORY (TO-DO BEFORE DOING)

- Add Type Of Card Into DataBase.✔
- Give Users Card Command/ Function.✔
- Data Pagination Command Of Inventory.✔
- Scale cards by level (by card default numbers, attack type, and rarity) *If rarity is high, scaling is high. *If attack type for example is attack, scale attack more than other values.
- Create Card Combining.
- Give Users a way to get cards naturally.
- Make a Daily Shop Of Low-Rare Cards.

How Daily Shop Will Work:

- More Common Cards: Cheaper
- Your Luck Stat Mixed With Level Will grant you rarer rewards very very slowly.

Weekly Shop:

- More Rare Cards But Still Some Common: More Expensive
- Your Luck Stat Mixed With Level Will grant you rarer rewards very very slowly.

Monthly Shop:

- The Most Rare Cards: The Most Expensive.
- Your Luck Stat Mixed With Level Will grant you even rarer cards very very slowly.

How Drops From Dungeons Work:

- You will always gain experience from the dungeon.
- 60/100 Chance to get a card
- Very Rare Chance to gain point reset(Will Figure Out Later)

How Drops From Campaign Work:

- (Will Manually Make Each Campaign. I Kinda Have To)
- You are guaranteed a Card Drop From a Set Of Guaranteed Cards List (Percentages Vary).
- A Specific Amount Of Money.
- You Can Repeat Recently Completed Campaign Levels.

How The Fighting Works:

- Basically Pokemon like system:
- Health is linked to user health stat instead.
- User's Card Type Speed mixed with user-stat-speed will combine. (Example, Using the "Flash" card will mix the cards speed with the users speed, therefore having a use of point-tree.)
- Tank Cards will have low dmg and low Speed but will take the hit of the card being thrown at ${Defense - Attack/Ability}
- Ability Cards Will have High Damage but low speed and low Tank, Therefore. IT's a risk to take.
- Attack Cards Will be the most balance of all 3.
- The Strategy is the user will have to plan out his point tree with his deck he wants to make.
- Tree Resets Will be Offered But Very Rarily.

MAKE A STORY (Get Creative)

MAKE MAP IMAGE TEMPLATE

MAKE A MAP(Use ImageScript)

MAKE A TRADE REQUEST + COUNTER TRADE SYSTEM (Think this out when it comes to it)

IMPLEMENT APP INTERACTIONS (Trade Request, View Profile)
