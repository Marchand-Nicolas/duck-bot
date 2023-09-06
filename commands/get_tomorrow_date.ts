import { CommandInteraction, TextChannel } from "discord.js";

const getTomorrowDate = async (interaction: CommandInteraction) => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  await interaction.reply({
    content: `Tomorrow date is <t:${Math.floor(
      date.getTime() / 1000
    )}:D> | __${date.toString()}__`,
    ephemeral: true,
  });
};

module.exports = {
  name: "get-tomorrow-date",
  description: "Get tomorrow date",
  execute: getTomorrowDate,
};
