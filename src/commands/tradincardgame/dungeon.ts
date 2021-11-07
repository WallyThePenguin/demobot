import { Embed } from "../../utils/Embed.ts";
import { createCommand } from "../../utils/helpers.ts";
import { Components } from "../../utils/components.ts";
import { initiateDungeon } from "../../database/client.ts";
import { needButton } from "../../utils/collectors.ts";
import { sql, gamedatacheck, searchcard, randomCardFromDeck, xpchange, givechest } from "../../database/client.ts";
import { enemyEntitySchema, enemyuserstats, usercardinventory, globalcardlist } from "../../database/schemas.ts";
import { bot } from "../../../cache.ts";
createCommand({
  name: `dungeon`,
  aliases: [`dungeonstart`, `fight`],
  description: `This is to start a dungeon!`,
  guildOnly: false,
  execute: async (message) => {
    //Check If there DATA exists, or else the bot crashes when running the functions.
    const datacheck = gamedatacheck(message.authorId);
    if (!datacheck) return message.reply(`Hey, seems like you're new, to get started, use the !tradingstart command!`);
    //Winner is undefined currently.
    let winner = undefined;
    //Timeout is false by default.
    let timeout = false;
    //Dungeon Level Changed throughout the Session
    let dungeonLevel = 1;
    //Make Starter Embeds, And Yes/No Buttons
    const StartingEmbed = new Embed()
      .setTitle(`Dungeon Starting...`)
      .setDescription(`Please Wait a Moment...`)
      .setTimestamp();
    const unfinishedFightEmbed = new Embed()
      .setTitle(`You Have an Unfinished Session!`)
      .setDescription(`Would you like to finish your old session? If you press \`No\` you will lose Rewards!`)
      .setTimestamp();
    const unfinishedEmbedButtons = new Components().addButton(`Yes`, "Success", "yes").addButton(`No`, "Danger", "no");
    //Function To make Embeds for the Fight Itself by just inputting Visual Information.
    function FlexibleFightEmbed(
      userhealth: number,
      enemyhealth: number,
      user: enemyuserstats,
      enemy: enemyEntitySchema,
      start: boolean,
      lastusercardused?: string,
      lastenemycardused?: string,
      lastuserhealth?: number,
      lastenemyhealth?: number
    ): Embed {
      if (start) {
        const startembed = new Embed()
          .setTitle(`You are Fighting... ${enemy.enemyTemplate.name}!`)
          .setThumbnail(enemy.enemyTemplate.image)
          .addField(`Enemy Health:`, `${enemyhealth}/${enemy.enemyHealth}`)
          .addField(`Your Health:`, `${userhealth}/${user.enemyHealth}`)
          .addField(`What Do You Want To Do?`, `Choose a Button.`)
          .setTimestamp()
          .setColor("Red");
        return startembed;
      } else {
        const Phrases = ["Wow!", "Amazing!", "What a Battle!", "OH!"];
        const midfightembed = new Embed()
          .setTitle(Phrases[~~(Phrases.length * Math.random())])
          .setThumbnail(enemy.enemyTemplate.image)
          .addField(`What Do You Wanna Do?`, `**Choose a Button**`)
          .addBlankField()
          .addField(`Enemy Used:`, `*${lastenemycardused}**`)
          .addField(`You Used:`, `**${lastusercardused}**`)
          .addBlankField()
          .addField(`He Dealt:`, `**${lastuserhealth! - userhealth}**`)
          .addField(`You Dealt:`, `**${lastenemyhealth! - enemyhealth}**`)
          .addBlankField()
          .addField(`Enemy Health:`, `**${enemyhealth}/${enemy.health}**`)
          .addField(`Your Health:`, `**${userhealth}/${user.enemyHealth}**`);
        return midfightembed;
      }
    }
    function autoCardButtons(cards: Array<number>): Components {
      const cardbuttons = new Components();
      cards.forEach((card) => {
        cardbuttons.addButton(`${card}`, "Primary", `${card}`);
      });
      return cardbuttons;
    }
    function YouWonEmbed(level: number, enemy: enemyEntitySchema, chestlevel: number): Embed {
      const YouWon = new Embed()
        .setTitle(`You Won!`)
        .setThumbnail(
          `https://cdn.discordapp.com/attachments/882786522439512065/906785249604812810/58ee7c023545163ec1942ca9.png`
        )
        .addField(`You Beat:`, `${enemy.enemyTemplate.name} LVL: ${level} Type: ${enemy.enemyTemplate.type}`)
        .addField(
          `What you can get if you end session:`,
          `**${level * 10}** Gold. \n Chest: ${chestlevel} \n XP: **${level * 20}`
        )
        .addField(`Would you like to continue?`, `Select an Option.`)
        .setColor(`Green`);
      return YouWon;
    }
    const FinishedWinnerButtons = new Components()
      .addButton(`End`, "Danger", `end`)
      .addButton(`Continue`, "Success", `continue`);
    function YouLostEmbed(level: number, enemy: enemyEntitySchema): Embed {
      const YouLost = new Embed()
        .setTitle(`You Lost...`)
        .setThumbnail(`https://cdn.discordapp.com/attachments/882786522439512065/906785354168823828/winnercrown.png`)
        .addField(`You Lost To:`, `${enemy.enemyTemplate.name} LVL: ${level} Type: ${enemy.enemyTemplate.type}`)
        .addField(`Your rewards got cut in half:`, `**${level * 5}** Gold. \n No Chest... \n XP: **${level * 10}**`)
        .addField(`Would you like to make a new Session?`, `Ignore if you don't want to play a new session.`);
      return YouLost;
    }
    const FinishedLoserButtons = new Components().addButton(`New Session`, `Success`, `new`);
    //Now We Start By doing beginning sequence of checking if they have an existing session.
    const dungeonEmbed = await message.reply({ embeds: [StartingEmbed] });
    //If they Do, well edit the message to say they do, and see what they react with.
    if (bot.unfinishedFightsCache.has(message.authorId)) {
      const updatedMessage = await dungeonEmbed.edit({
        embeds: [unfinishedFightEmbed],
        components: unfinishedEmbedButtons,
      });
      const Pressed = await needButton(message.authorId, updatedMessage.id);
      if (Pressed.interaction) {
        if (Pressed.customId == "yes") {
          //Ok They Said yes lets get the info from our cache and get started
          //Get Our Unfinished Session
          const unfinishedSession = bot.unfinishedFightsCache.get(message.authorId);
          //We need to get all the stats needed:
          let userhealth = unfinishedSession!.userhealth;
          let enemyhealth = unfinishedSession!.enemyhealth;
          let lastcarduserUsed = "Something";
          let lastcardenemyUsed = "SomethingElse";
          const userstats = unfinishedSession!.userstats;
          const enemyEntity = unfinishedSession!.enemyuser;
          //Create a FightCache:
          bot.fightCache.set(message.authorId, unfinishedSession!);
          //Delete UnfinishedSession since its being finished now.
          bot.unfinishedFightsCache.delete(message.authorId);
          //Very Flexible embed here.
          let FightEmbed = FlexibleFightEmbed(userhealth, enemyhealth, userstats, enemyEntity, true);
          //Session buttons.
          const UnfinishedButtons = autoCardButtons(unfinishedSession!.usercards);
          //Update Embed with this:
          let embedUpdate = await updatedMessage.edit({ embeds: [FightEmbed], components: UnfinishedButtons });
          let buttonToken = await needButton(message.authorId, message.id);
          //Cool They Pressed a card button!
          if (buttonToken.customId) {
            //The Bot Handling Fights Loop:
            //If User Health and Enemy Health not 0, just keep going.
            while (userhealth >= 0 && enemyhealth >= 0) {
              //Find the Card the User selected.
              const [cardused] = await sql<
                (usercardinventory & globalcardlist)[]
              >`SELECT * FROM "usercardinventory" INNER JOIN "globalcardlist" ON "globalcardlist"."id"="usercardinventory"."id" WHERE cardnumber = ${Number(
                buttonToken.customId
              )}`;
              lastcarduserUsed = `${cardused.name} LVL: ${cardused.level}`;
              //We used Let to be flexible with the after the game is won/lost/paused.
              dungeonLevel = unfinishedSession!.level;
              //Now Combine the Stats with the Card Selected
              const attackPower = cardused.attack + userstats.basicattack;
              const defence = cardused.defence + userstats.defence;
              const speed = cardused.speed + userstats.speed;
              const abilityPower = cardused.magic + userstats.abilitypower;
              //Get Enemy Card.
              const randomEnemyCard = randomCardFromDeck(enemyEntity.enemycards);
              const enemyCardStats = await searchcard(randomEnemyCard);
              lastcardenemyUsed = `${enemyCardStats.name} LVL: ${enemyCardStats.level}`;
              //Combine Enemy Card with Enemy Stats.
              const enemyAttack = enemyCardStats.attack + enemyEntity.enemystats.basicattack;
              const enemyDefence = enemyCardStats.defence + enemyEntity.enemystats.defence;
              const enemySpeed = enemyCardStats.speed + enemyEntity.enemystats.speed;
              const enemyAbilityPower = enemyCardStats.magic + enemyEntity.enemystats.abilitypower;
              //Whoever is faster hits first: So do an if statement to see whos faster.
              if (enemySpeed > speed) {
                //See the Difference for Damage on UserCard defence against
                const enemyPowerUserDefenceDifference = Math.floor(
                  enemyAttack - defence + (enemyAbilityPower - defence / 2)
                );
                //Subtract it from health
                let olduserhealth = userhealth;
                userhealth = userhealth - enemyPowerUserDefenceDifference;
                //Notify User.
                embedUpdate = await embedUpdate.edit(
                  `${enemyEntity.enemyTemplate.name} Hit First! Used: ${lastcardenemyUsed} Dealt: ${enemyPowerUserDefenceDifference}`
                );
                //Check if User health is over or equal to 0:
                if (!(userhealth >= 0)) {
                  winner = "enemy";
                  break;
                }
                //Now Part 2, Opposing Side.
                const userPowerEnemyDefenceDifference = Math.floor(
                  attackPower - enemyDefence + (abilityPower - enemyDefence / 2)
                );
                //Subtract it From Health
                let oldenemyhealth = enemyhealth;
                enemyhealth = enemyhealth - userPowerEnemyDefenceDifference;
                embedUpdate = await embedUpdate.edit({
                  embeds: [
                    FlexibleFightEmbed(
                      userhealth,
                      enemyhealth,
                      userstats,
                      enemyEntity,
                      false,
                      lastcarduserUsed,
                      lastcardenemyUsed,
                      olduserhealth,
                      oldenemyhealth
                    ),
                  ],
                });
                buttonToken = await needButton(message.authorId, embedUpdate.id).catch(undefined);
                if (!buttonToken) {
                  timeout = true;
                  break;
                }
              } else {
                //See Difference
                const userPowerEnemyDefenceDifference = Math.floor(
                  attackPower - enemyDefence + (abilityPower - enemyDefence / 2)
                );
                //Subtract it From Health
                let oldenemyhealth = enemyhealth;
                enemyhealth = enemyhealth - userPowerEnemyDefenceDifference;
                //Notify User.
                embedUpdate = await embedUpdate.edit(`You Hit First! Dealt: ${userPowerEnemyDefenceDifference}`);
                //Check if Enemy health is over or equal to 0:
                if (!(enemyhealth >= 0)) {
                  winner = "user";
                  break;
                }
                //Now Part 2, Opposing Side.
                let enemyPowerUserDefenceDifference = Math.floor(
                  enemyAttack - defence + (enemyAbilityPower - defence / 2)
                );
                //Subtract it from health
                let olduserhealth = userhealth;
                userhealth = userhealth - enemyPowerUserDefenceDifference;
                if (!(userhealth >= 0)) {
                  winner = "enemy";
                  break;
                }
                embedUpdate = await embedUpdate.edit({
                  embeds: [
                    FlexibleFightEmbed(
                      userhealth,
                      enemyhealth,
                      userstats,
                      enemyEntity,
                      false,
                      lastcarduserUsed,
                      lastcardenemyUsed,
                      olduserhealth,
                      oldenemyhealth
                    ),
                  ],
                });
                buttonToken = await needButton(message.authorId, embedUpdate.id).catch(undefined);
                if (!buttonToken) {
                  timeout = true;
                  break;
                }
              }
            }
            //IF the user does not press a button or is Idle for ~5 Minutes, Timeout, cache everything, delete buttons, return.
            if (timeout) {
              bot.unfinishedFightsCache.set(message.authorId, {
                enemycards: enemyEntity.enemycards,
                level: dungeonLevel,
                userstats: userstats,
                userhealth: userhealth,
                usercards: unfinishedSession!.usercards,
                enemyuser: enemyEntity,
                enemyhealth: enemyhealth,
              });
              await embedUpdate.edit({ components: undefined });
              message.reply(
                `Hey, we saw that you Timed out, so we paused your gameplay, use the dungeon command again to resume!`
              );
              return;
            }
            //If the Winner is the User.
            if (winner == "user") {
              //You Won Embed, then Continue/End Session Buttons.
              const chestlevel = Math.floor(dungeonLevel * 0.05);
              const winnermessage = await embedUpdate.edit({
                embeds: [YouWonEmbed(dungeonLevel, enemyEntity, chestlevel)],
                components: FinishedWinnerButtons,
              });
              const winnerButton = await needButton(message.authorId, winnermessage.id).catch(undefined);
              if (!winnerButton) {
                //If no button pressed just assume its an end session, give awards and delete buttons. return;
                await givechest(message.authorId, chestlevel);
                await winnermessage.edit({ components: undefined });
                await xpchange(message.authorId, dungeonLevel * 20, true);
                await sql`UPDATE "GameUserSchema" SET "money"="money"+${
                  dungeonLevel * 10
                } WHERE id = ${message.authorId.toString()}`;
                return;
              }
              if (winnerButton.interaction) {
                if (winnerButton.customId == "continue") {
                  dungeonLevel = dungeonLevel + 1;
                  const newLevel = await initiateDungeon(message.authorId, false);
                  //Continue Session Here
                } else {
                  //End Session, Give awards and delete components. return;
                  await givechest(message.authorId, chestlevel);
                  await winnermessage.edit({ components: undefined });
                  await xpchange(message.authorId, dungeonLevel * 20, true);
                  await sql`UPDATE "GameUserSchema" SET "money"="money"+${
                    dungeonLevel * 10
                  } WHERE id = ${message.authorId.toString()}`;
                  return;
                }
              }
            } else {
              //You Lost Embed, then New Session Button.
              //User only gets half rewards, reward it from now.
              await xpchange(message.authorId, dungeonLevel * 10, true);
              await sql`UPDATE "GameUserSchema" SET "money"="money"+${
                dungeonLevel * 5
              } WHERE id= ${message.authorId.toString()}`;
              const loserEmbed = await embedUpdate.edit({
                embeds: [YouLostEmbed(dungeonLevel, enemyEntity)],
                components: FinishedLoserButtons,
              });
              const loserButton = await needButton(message.authorId, loserEmbed.id).catch(undefined);
              //If they dont press "New Session" just delete button and return
              if (!loserButton) {
                const finishSession = await embedUpdate.edit({
                  components: undefined,
                });
                return;
              }
              if (loserButton.interaction) {
                dungeonLevel = 1;
                const newSession = initiateDungeon(message.authorId, true);
                //Create a New Session:
              }
            }
          }
        } else {
          bot.unfinishedFightsCache.delete(message.authorId);
          dungeonLevel = 1;
          const newDungeon = await initiateDungeon(message.authorId, true);
          //Create a New Session:
        }
      }
    }
  },
});
