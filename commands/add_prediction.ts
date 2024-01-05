import { CommandInteraction, TextChannel } from "discord.js";
import getDbOptions from "../utils/getDbOptions";
import { createConnection } from "mysql2/promise";
import refreshPredictionMessage from "../utils/refreshPredictionMessage";

const addPrediction = async (interaction: CommandInteraction) => {
  if (typeof interaction.member?.permissions === "string") {
    await interaction.reply({
      content: "Bad permissions format",
      ephemeral: true,
    });
    return;
  }
  if (!interaction.member?.permissions.has("Administrator")) {
    await interaction.reply({
      content:
        "You don't have permission to use this command. To predict a duck price, use the /predict command",
      ephemeral: true,
    });
    return;
  }
  const title = interaction.options.get("prediction-title")?.value as string;
  const stringStartDate = (interaction.options.get("start-date")?.value ||
    0) as string;
  const stringEndDate = interaction.options.get("end-date")?.value as string;
  const duckImage = interaction.options.get("duck-image")?.attachment;
  const endImage = interaction.options.get("end-image")?.attachment;
  const predictionId = interaction.options.get("prediction-id")
    ?.value as string;

  const startDate = stringStartDate ? Date.parse(stringStartDate) : new Date();
  const endDate = new Date(Date.parse(stringEndDate));

  if (!duckImage) {
    await interaction.reply({
      content: "Duck image not found",
      ephemeral: true,
    });
    return;
  }

  if (!endImage) {
    await interaction.reply({
      content: "End image not found",
      ephemeral: true,
    });
    return;
  }

  const channel = interaction.channel as TextChannel;
  const channelId = channel.id;

  if (!channel) {
    await interaction.reply({
      content: "Prediction channel not found",
      ephemeral: true,
    });
    return;
  }

  const connection = await createConnection(getDbOptions());

  const [rows] = await connection.execute(
    "SELECT * FROM predictions WHERE started = 1 AND ENDED = 0 AND channelId = ?",
    [channelId]
  );

  if (Array.isArray(rows) && rows.length > 0 && !predictionId) {
    await interaction.reply({
      content: "There is already an active prediction",
      ephemeral: true,
    });
    return;
  }

  if (!predictionId) {
    const message = await channel.send(
      "This message is going to contain predictions. Please do not delete it"
    );

    const [res] = await connection.execute(
      `INSERT INTO predictions (title, start_date, end_date, duck_image, end_image, channelId, messageId) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        startDate,
        endDate,
        duckImage.url,
        endImage.url,
        channel.id,
        message.id,
      ]
    );
  } else
    await connection.execute(
      `UPDATE predictions SET title = ?, start_date = ?, end_date = ?, duck_image = ?, end_image = ? WHERE id = ?`,
      [title, startDate, endDate, duckImage.url, endImage.url, predictionId]
    );

  connection.end();

  if (predictionId) refreshPredictionMessage(interaction.client, channel.id);

  await interaction.reply({
    content: !predictionId
      ? `Prediction **${title}** added`
      : `Prediction **${title}** edited`,
    ephemeral: true,
  });
};

module.exports = {
  name: "add-new-prediction",
  description: "Creates a new prediction",
  execute: addPrediction,
  options: [
    {
      name: "prediction-title",
      description: "The title of the prediction",
      type: 3,
      required: true,
    },
    {
      name: "end-date",
      description: "Duration in hours (floats allowed)",
      type: 3,
      required: true,
    },
    {
      name: "duck-image",
      description: "The duck illustration",
      type: 11,
      required: true,
    },
    {
      name: "end-image",
      description:
        "Will replace the duck illustration when the prediction ends",
      type: 11,
      required: true,
    },
    {
      name: "start-date",
      description: "Start in x hours (floats allowed) (optional)",
      type: 3,
      required: false,
    },
    {
      name: "prediction-id",
      description: "The id of the prediction to edit (optional)",
      type: 3,
      required: false,
    },
  ],
};
