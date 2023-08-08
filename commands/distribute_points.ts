import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  CommandInteraction,
} from "discord.js";
import getDbOptions from "../utils/getDbOptions";
import { createConnection } from "mysql2/promise";

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

  const connection = await createConnection(getDbOptions());

  const [rows] = await connection.execute(
    `SELECT * FROM predictions WHERE price = 0 AND ended = 1 ORDER BY id DESC LIMIT 1;`
  );

  connection.end();

  if ((rows as any).length === 0) {
    await interaction.reply({
      content: "Prediction not found",
      ephemeral: true,
    });
    return;
  }

  const prediction = (rows as any)[0];

  const setPrice = new ButtonBuilder()
    .setLabel("Set price")
    .setCustomId(`set-prediction-price-${prediction.id}`)
    .setStyle(ButtonStyle.Primary);

  const row = new ActionRowBuilder().addComponents(setPrice);

  await interaction.reply({
    content: `**SET THE FINAL DUCK PRICE FOR __${prediction.title.toUpperCase()}__ WHICH ENDED <t:${Math.floor(
      prediction.end_date.getTime() / 1000
    )}:R>**`,
    ephemeral: true,
    components: [row as any],
  });
};

module.exports = {
  name: "distribute-points",
  description: "A menu will show up to set the final duck price.",
  execute: distributePoints,
};
