import { CommandInteraction, TextChannel } from "discord.js";
import getDbOptions from "../utils/getDbOptions";
import readConfig from "../utils/readConfig";
import { createConnection } from "mysql2/promise";
import writeConfig from "../utils/writeConfig";

const addPrediction = async (interaction: CommandInteraction) => {
  if (typeof interaction.member?.permissions === "string") return;
  if (!interaction.member?.permissions.has("Administrator")) {
    await interaction.reply({
      content:
        "You don't have permission to use this command. To predict a duck price, use the /predict command",
      ephemeral: true,
    });
    return;
  }
  const title = interaction.options.get("prediction-title")?.value as string;
  const startIn = (interaction.options.get("start-in")?.value || 0) as number;
  const duration = interaction.options.get("duration")?.value as number;
  const duckImage = interaction.options.get("duck-image")?.attachment;
  const endImage = interaction.options.get("end-image")?.attachment;

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

  const config = readConfig();

  if (!config.predictionChannelId) {
    await interaction.reply({
      content: "Prediction channel not set",
      ephemeral: true,
    });
    return;
  }

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

  // Check if duration is valid
  if (isNaN(duration) || duration <= 0) {
    await interaction.reply({
      content: "Invalid duration",
      ephemeral: true,
    });
    return;
  }

  const now = new Date();
  const nowTimestamp = now.getTime();

  const startDate = new Date(nowTimestamp + startIn * 60 * 60 * 1000);

  const endDate = new Date(startDate.getTime() + duration * 60 * 60 * 1000);

  const connection = await createConnection(getDbOptions());

  const [rows] = await connection.execute(
    "SELECT * FROM predictions WHERE started = 1 AND ENDED = 0"
  );

  if (Array.isArray(rows) && rows.length > 0) {
    await interaction.reply({
      content: "There is already an active prediction",
      ephemeral: true,
    });
    return;
  }

  const message = await channel.send(
    "This message is going to contain predictions. Please do not delete it"
  );
  writeConfig("predictionMessageId", message.id);

  await connection.execute(
    `INSERT INTO predictions (title, start_date, end_date, duck_image, end_image) VALUES (?, ?, ?, ?, ?)`,
    [title, startDate, endDate, duckImage.url, endImage.url]
  );

  connection.end();

  await interaction.reply({
    content: `Prediction **${title}** added`,
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
      name: "duration",
      description: "Duration in hours (floats allowed)",
      type: 10,
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
      name: "start-in",
      description: "Start in x hours (floats allowed)",
      type: 10,
      required: false,
    },
  ],
};
