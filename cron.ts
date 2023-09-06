import { Client, TextChannel } from "discord.js";
import getDbOptions from "./utils/getDbOptions";
import readConfig from "./utils/readConfig";
import { createConnection } from "mysql2/promise";
import refreshPredictionMessage from "./utils/refreshPredictionMessage";
import computePrice from "./utils/computePrice";

const startCron = (client: Client) => {
  refresh(client);
  setInterval(() => refresh(client), 1000);
};

const refresh = async (client: Client) => {
  const options = getDbOptions() as any;
  // Support bigints
  options.supportBigNumbers = true;
  options.bigNumberStrings = true;
  const connection = await createConnection(options);

  const [rows, fields] = await connection.execute(
    "SELECT * FROM predictions WHERE ended = 0"
  );

  if (!Array.isArray(rows)) return connection.end();

  for (let index = 0; index < rows.length; index++) {
    const prediction = rows[index] as any;
    const id = prediction.id;
    const started = prediction.started;
    const endDate = new Date(prediction.end_date);
    const now = new Date();
    const startDate = new Date(prediction.start_date);
    const title = prediction.title;
    const endImage = prediction.end_image as string;
    // Check if prediction has started
    if (started === 0 && startDate.getTime() <= now.getTime()) {
      const config = readConfig();
      if (!config.predictionChannelId) return;
      const channel = (await client.channels.fetch(
        config.predictionChannelId
      )) as TextChannel;
      if (!channel) return;
      const message = await channel.messages.fetch(config.predictionMessageId);
      if (!message) return;
      await connection.execute(
        "UPDATE predictions SET started = 1 WHERE id = ?",
        [id]
      );
      await refreshPredictionMessage(client);
      return;
    }
    // Check if prediction has ended
    if (endDate.getTime() <= now.getTime()) {
      const config = readConfig();
      if (!config.predictionChannelId) return;
      const channel = (await client.channels.fetch(
        config.predictionChannelId
      )) as TextChannel;
      if (!channel) return;
      const message = await channel.messages.fetch(config.predictionMessageId);
      if (!message) return;
      const [userPredictions] = await connection.execute(
        "SELECT * FROM user_predictions WHERE prediction_id = ?",
        [id]
      );
      if (!Array.isArray(userPredictions)) return;
      let newMessageContent = `**~ PREDICTIONS FOR ${title.toUpperCase()} ARE NOW CLOSED ~**`;
      if (userPredictions.length) newMessageContent += "\n\nPredictions:\n";

      for (let index = 0; index < userPredictions.length; index++) {
        const element = userPredictions[index] as any;
        newMessageContent += "\n";
        newMessageContent += `**${computePrice(element.price)} ETH** <@${
          element.user_id
        }>`;
      }
      message.edit({
        content: newMessageContent,
        files: [endImage],
      });
      await connection.execute(
        "UPDATE predictions SET ended = 1 WHERE id = ?",
        [id]
      );
      return;
    }
  }
  connection.end();
};

export default startCron;
