import { Embed } from "./src/utils/Embed.ts";
// The profile picture of my bot will not change, So i set a constant here.
export const PFPURL = "https://cdn.discordapp.com/attachments/784318757673762857/784980157085515806/blackfist.jpg";
//MAIN RULES that the setup command will use with the reaction roles event.
export const setupRules = new Embed()
  .setColor("#FF0D00")
  .setTitle("Project Democracy Rules:")
  .addField(
    `Discord Terms Of Service(TOS) and Guidelines`,
    `Follow the [Official TOS](https://discordapp.com/terms) And [Guidelines](https://discordapp.com/guidelines) for a safe and enjoyable community experience.`
  )
  .addField(
    "If you witness conduct that violates these rules,",
    "please @mention or direct message an available Helper or Moderator. If none are readily available, you may use @Mods for situations that require immediate intervention."
  )
  .addField(
    "General Rules:",
    `1-  Be cool, kind, and civil. Treat all members with respect and express your thoughts in a constructive manner. \n2- Use an appropriate name and avatar. Avoid special characters, emoji, obscenities, and impersonation. \n3- No self-promotion or advertisements. This includes unsolicited references and links to other social media, servers, communities, and services in chat or direct messages. \n4- No personal information. Protect your privacy and the privacy of others.\n5- No racist, sexist, anti-LGBTQ+, or otherwise offensive content. We have zero-tolerance for hate speech. \n6- No harassment, abuse, or bullying. We have zero-tolerance for harming others. \n7- The use of NSFW content is forbidden. \n8- Rules are subject to common sense. These rules are not comprehensive and use of loopholes to violate the spirit of these rules is subject to enforcement.`
  )
  .addField(
    "Please note,",
    `Mods and Helpers in this server are subject to Banning/Kicking Users without warning. Mods are also subject to these rules.`
  )
  .addField(
    "React To get Verified",
    `When you react (👍), you are confirming you understand the rules and are willing to uphold them and face the consequences of failing to do so.`
  )
  .setFooter("Project Democracy", PFPURL);
//VC rules are here.
export const vcrules = new Embed()
  .setColor("#FF0D00")
  .setTitle("Project Democracy VC Rules:")
  .setDescription(
    `1- Don’t be too excessive and brutal with the bad words keep them at minimal. \n2- Do not intentionally make loud noises. \n3- Don’t be overly obnoxious or a staff member will remove you. \n4- Wait your turn to speak.`
  )
  .setFooter("Project Democracy", PFPURL);
//Image Rules are here.
export const imagerules = new Embed()
  .setColor("#FF0D00")
  .setTitle("Project Democracy Image-Posting Rules:")
  .setDescription(
    `1- Do not spam.\n2- No inappropriate images that might contain nudity. Images with minimal violence are allowed just no gore. \n3- Do not post images that might be offensive to others/racism/homophobic.\n4- Do not post images for no reason. Images posted must be relevant to the conversation.`
  )
  .setFooter("Project Democracy", PFPURL);
//general Rules are here.
export const generalrules = new Embed()
  .setColor("#FF0D00")
  .setTitle("Project Democracy General Rules:")
  .setDescription(
    `1-  Be cool, kind, and civil. Treat all members with respect and express your thoughts in a constructive manner. \n2- Use an appropriate name and avatar. Avoid special characters, emoji, obscenities, and impersonation. \n3- No self-promotion or advertisements. This includes unsolicited references and links to other social media, servers, communities, and services in chat or direct messages. \n4- No personal information. Protect your privacy and the privacy of others.\n5- No racist, sexist, anti-LGBTQ+, or otherwise offensive content. We have zero-tolerance for hate speech. \n6- No harassment, abuse, or bullying. We have zero-tolerance for harming others. \n7- The use of NSFW content is forbidden. \n8- Rules are subject to common sense. These rules are not comprehensive and use of loopholes to violate the spirit of these rules is subject to enforcement.`
  )
  .setFooter("Project Democracy", PFPURL);
//Polling Info.
export const pollinghelp = new Embed()
  .setColor("#fab002")
  .setTitle("Polls: How they work.")
  .addField(
    "Every Week,",
    `3 Candidates are selected randomly based on activity. Basically, the more active you are, the more of a chance you have at becoming the Leader of this server.`
  )
  .addField("Benefits Of Becoming Leader:", `Benefits:`)
  .setFooter("Project Democracy", PFPURL);
