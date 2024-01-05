import {
  ActionRowBuilder,
  ButtonBuilder,
  CommandInteraction,
  ButtonStyle,
} from "discord.js";
import getDbOptions from "../utils/getDbOptions";
import refreshPredictionMessage from "../utils/refreshPredictionMessage";
import { createConnection } from "mysql2/promise";

const predict = async (interaction: CommandInteraction) => {
  const predictionPrice = interaction.options.get("price")?.value;

  if (
    typeof predictionPrice !== "number" ||
    isNaN(predictionPrice) ||
    predictionPrice <= 0
  ) {
    await interaction.reply({
      content: "Invalid price",
      ephemeral: true,
    });
    return;
  }

  const db = await createConnection(getDbOptions());
  // Get current predictions
  const [rows] = await db.execute(
    "SELECT * FROM predictions WHERE started = 1 AND ENDED = 0 AND channelId = ?",
    [interaction.channelId]
  );
  if (!Array.isArray(rows)) {
    await interaction.reply({
      content: "Error getting predictions",
      ephemeral: true,
    });
    return db.end();
  }
  if (rows.length === 0) {
    await interaction.reply({
      content: "No ducks prices to predict at the moment",
      ephemeral: true,
    });
    return db.end();
  }

  const prediction = rows[0] as any;
  const id = prediction.id;
  // Check if the user already predicted
  await db.execute(
    "DELETE FROM user_predictions WHERE prediction_id = ? AND user_id = ?",
    [id, interaction.user.id]
  );

  await db.execute(
    "INSERT INTO user_predictions (prediction_id, user_id, price) VALUES (?, ?, ?)",
    [id, interaction.user.id, predictionPrice]
  );

  refreshPredictionMessage(interaction.client, prediction.channelId);

  const channelId = prediction.channelId;
  const messageId = prediction.messageId;

  db.end();

  const viewPredictions = new ButtonBuilder()
    .setLabel("View predictions")
    .setURL(
      `https://discord.com/channels/${interaction.guildId}/${channelId}/${messageId}`
    )
    .setStyle(ButtonStyle.Link);

  const row = new ActionRowBuilder().addComponents(viewPredictions);

  await interaction.reply({
    content: "Prediction saved",
    components: [row as any],
    ephemeral: true,
  });
};

module.exports = {
  name: "predict",
  description: "Try to predict the price of a duck",
  execute: predict,
  options: [
    {
      name: "price",
      description: "Your price prediction",
      type: 10,
      required: true,
    },
  ],
};
