import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  CommandInteraction,
} from "discord.js";

const distributePoints = async (interaction: CommandInteraction) => {
  if (typeof interaction.member?.permissions === "string") return;
  if (!interaction.member?.permissions.has("Administrator")) {
    await interaction.reply({
      content:
        "You don't have permission to use this command. To predict a duck price, use the /predict command",
      ephemeral: true,
    });
    return;
  }

  const resetDb = new ButtonBuilder()
    .setLabel("Reset database")
    .setCustomId(`reset-db`)
    .setStyle(ButtonStyle.Danger);

  const row = new ActionRowBuilder().addComponents(resetDb);

  await interaction.reply({
    content: `⚠️ **THIS IS GOING TO RESET THE DATABASE. THIS IS IRREVERSIBLE. ARE YOU SURE YOU WANT TO DO THIS?** ⚠️`,
    ephemeral: true,
    components: [row as any],
  });
};

module.exports = {
  name: "reset",
  description: "This will reset the database.",
  execute: distributePoints,
};
