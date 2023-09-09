import { CommandInteraction, TextChannel } from "discord.js";
import getDbOptions from "../utils/getDbOptions";
import { RowDataPacket, createConnection } from "mysql2/promise";
import readConfig from "../utils/readConfig";

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

  const [predictions] = await connection.execute(
    "SELECT * FROM predictions WHERE id = ?",
    [predictionId]
  );

  if (!Array.isArray(predictions)) return connection.end();

  if (!predictions.length) {
    await interaction.reply({
      content: "Prediction not found",
      ephemeral: true,
    });
    return connection.end();
  }

  const messageId = (predictions[0] as RowDataPacket).message_id;

  if (messageId !== "0") {
    // Delete message
    const config = readConfig();
    if (!config.predictionChannelId) return;
    const channel = (await interaction.guild?.channels.fetch(
      config.predictionChannelId
    )) as TextChannel;
    if (!channel) return;
    const message = await channel.messages.fetch(messageId);
    if (message) {
      await message.delete();
    }
  }

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
