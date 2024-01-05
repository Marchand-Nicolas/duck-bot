import { CommandInteraction, TextChannel } from "discord.js";
import getDbOptions from "../utils/getDbOptions";
import { createConnection } from "mysql2/promise";

const deletePrediction = async (interaction: CommandInteraction) => {
  if (typeof interaction.member?.permissions === "string") return;
  if (!interaction.member?.permissions.has("Administrator")) {
    await interaction.reply({
      content:
        "You don't have permission to use this command. To predict a duck price, use the /predict command",
      ephemeral: true,
    });
    return;
  }
  const predictionId = interaction.options.get("prediction-id")
    ?.value as string;

  const connection = await createConnection(getDbOptions());

  // Delete messages
  const [predictions] = await connection.execute(
    `SELECT channelId, messageId FROM predictions WHERE id = ?`,
    [predictionId]
  );
  if (!Array.isArray(predictions)) {
    await interaction.reply({
      content: "Error getting predictions",
      ephemeral: true,
    });
    connection.end();
    return;
  }
  if (!predictions.length) {
    await interaction.reply({
      content: "Prediction not found",
      ephemeral: true,
    });
    connection.end();
    return;
  }

  const prediction = predictions[0] as any;

  const channelId = prediction.channelId;
  const messageId = prediction.messageId;
  const channel = (await interaction.guild?.channels.fetch(
    channelId
  )) as TextChannel;
  if (!channel) return connection.end();

  await channel.messages.delete(messageId);

  await connection.execute(`DELETE FROM predictions WHERE id = ?`, [
    predictionId,
  ]);

  connection.end();

  await interaction.reply({
    content: "Prediction deleted",
    ephemeral: true,
  });
};

module.exports = {
  name: "delete-prediction",
  description: "Deleted the selected prediction.",
  options: [
    {
      name: "prediction-id",
      description:
        "The id of the prediction to delete. Use /list-predictions to get the id.",
      type: 4,
      required: true,
    },
  ],
  execute: deletePrediction,
};
