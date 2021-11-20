import { Embed } from "../../utils/Embed.ts";
import { createCommand } from "../../utils/helpers.ts";
import { Components } from "../../utils/components.ts";
import { initiateDungeon, createNewSession } from "../../database/client.ts";
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
    //Starting Embed
    const StartingEmbed = new Embed()
      .setTitle(`Dungeon Starting...`)
      .setDescription(`Please Wait a Moment...`)
      .setTimestamp();
    //Unfinished Fight.
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
      lastenemycardused?: string
    ): Embed {
      if (start) {
        const startembed = new Embed()
          .setTitle(`You are Fighting... ${enemy.enemyTemplate.name}!`)
          .setThumbnail(enemy.enemyTemplate.image)
          .addField(`Enemy Health:`, `${enemyhealth}/${enemy.enemyHealth}`)
          .addField(`Your Health:`, `${userhealth}/${user.health}`)
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
          .addBlankField()
          .addField(`Enemy Health:`, `**${enemyhealth}/${enemy.health}**`)
          .addField(`Your Health:`, `**${userhealth}/${user.health}**`);
        return midfightembed;
      }
    }
    function stringEmbed(string: string): Embed {
      const Phrases = ["Wow!", "Amazing!", "What a Battle!", "OH!"];
      const stringembed = new Embed().setTitle(Phrases[~~(Phrases.length * Math.random())]).setDescription(string);
      return stringembed;
    }
    async function autoCardButtons(cards: Array<number>): Promise<Components> {
      const card = await Promise.all(
        cards
          .filter((card) => card !== 0)
          .map(async (card) => {
            const cardsQuery = await sql<
              usercardinventory[] & globalcardlist[]
            >`SELECT * FROM "usercardinventory" INNER JOIN "globalcardlist" ON "globalcardlist"."id"="usercardinventory"."id" WHERE cardnumber = ${card}`;
            return cardsQuery[0];
          })
      );
      const cardbuttons = new Components();
      card.forEach((card) => {
        cardbuttons.addButton(`${card.name} LVL: ${card.level}`, "Primary", `${card.cardnumber}`);
      });
      return cardbuttons;
    }
    //Simple you won button
    function YouWonEmbed(level: number, enemy: enemyEntitySchema, chestlevel: number): Embed {
      const YouWon = new Embed()
        .setTitle(`You Won!`)
        .setThumbnail(`https://cdn.discordapp.com/attachments/882786522439512065/906785354168823828/winnercrown.png`)
        .addField(`You Beat:`, `${enemy.enemyTemplate.name} LVL: ${level} Type: ${enemy.enemyTemplate.type}`)
        .addField(
          `What you can get if you end session:`,
          `**${level * 10}** Gold. \n Chest: **${chestlevel}** \n XP: **${level * 20}**`
        )
        .addField(`Would you like to continue?`, `Select an Option.`)
        .setColor(`Green`);
      return YouWon;
    }
    //Simple Buttons
    const FinishedWinnerButtons = new Components()
      .addButton(`End`, "Danger", `end`)
      .addButton(`Pause`, `Primary`, `pause`)
      .addButton(`Continue`, "Success", `continue`);
    //Simple You Lost Embed.
    function YouLostEmbed(level: number, enemy: enemyEntitySchema): Embed {
      const YouLost = new Embed()
        .setTitle(`You Lost...`)
        .setThumbnail(
          `https://cdn.discordapp.com/attachments/882786522439512065/906785249604812810/58ee7c023545163ec1942ca9.png`
        )
        .addField(`You Lost To:`, `${enemy.enemyTemplate.name} LVL: ${level} Type: ${enemy.enemyTemplate.type}`)
        .addField(`Your rewards got cut in half:`, `**${level * 5}** Gold. \n No Chest... \n XP: **${level * 10}**`)
        .addField(`Would you like to make a new Session?`, `Ignore if you don't want to play a new session.`);
      return YouLost;
    }
    const WaitButton = new Components().addButton(`Wait...`, "Danger", "wait", { disabled: true });
    //Simple Buttons.
    const FinishedLoserButtons = new Components().addButton(`New Session`, `Success`, `new`);
    await createNewSession(
      message.member!,
      message,
      StartingEmbed,
      { unfinishedFightEmbed: unfinishedFightEmbed, unfinishedEmbedButtons: unfinishedEmbedButtons },
      { FlexibleFightEmbed: FlexibleFightEmbed, autoCardButtons: autoCardButtons },
      { YouWonEmbed: YouWonEmbed, WinnerButtons: FinishedWinnerButtons },
      { YouLostEmbed: YouLostEmbed, LoserButton: FinishedLoserButtons }
    );
    return;
  },
});
