import { ButtonInteraction, TextChannel } from "discord.js";
import getDbOptions from "../utils/getDbOptions";
import readConfig from "../utils/readConfig";
import { createConnection } from "mysql2/promise";

const resetDb = async (interaction: ButtonInteraction) => {
  const config = readConfig();

  const channel = (await interaction.guild?.channels.fetch(
    config.predictionChannelId
  )) as TextChannel;

  if (!channel) {
    await interaction.reply({
      content: "Prediction channel not found",
      ephemeral: true,
    });
    return;
  }

  const message = await channel?.messages.fetch(config.predictionMessageId);

  if (!message) {
    await interaction.reply({
      content: "Prediction message not found",
      ephemeral: true,
    });
    return;
  }

  const connection = await createConnection(getDbOptions());

  await connection.execute("DELETE FROM predictions");
  await connection.execute("DELETE FROM user_predictions");
  await connection.execute("DELETE FROM user_scores");

  connection.end();

  message.edit({
    content: "🦆",
    embeds: [],
    attachments: [],
  });

  await interaction.reply({
    content: "✅ Database reset",
    ephemeral: true,
  });
};

module.exports = resetDb;
