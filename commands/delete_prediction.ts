import { CommandInteraction } from "discord.js";
import mysql from "mysql2/promise";
import getDbOptions from "../utils/getDbOptions";

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

  const connection = await mysql.createConnection(getDbOptions());

  const [rows] = await connection.execute(
    `DELETE FROM predictions WHERE id = ?`,
    [predictionId]
  );

  connection.end();

  await interaction.reply({
    content:
      (rows as any).affectedRows === 1 ? "Prediction deleted" : "Not found",
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
