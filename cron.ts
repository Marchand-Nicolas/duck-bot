import { Client, TextChannel } from "discord.js";
import getDbOptions from "./utils/getDbOptions";
import readConfig from "./utils/readConfig";
import { createConnection } from "mysql2/promise";

const startCron = (client: Client) => {
  refresh(client);
  setInterval(() => refresh(client), 1000);
};

const refresh = async (client: Client) => {
  const connection = await createConnection(getDbOptions());

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
    const duckImage = prediction.duck_image as string;
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

      message.edit({
        content: `✅ **PREDICTIONS ARE OPEN FOR ${title.toUpperCase()} AND WILL END <t:${Math.floor(
          endDate.getTime() / 1000
        )}:R> ** ✅\n\n➡️ **To predict a price, use the /predict command**`,
        files: [duckImage],
      });
      await connection.execute(
        "UPDATE predictions SET started = 1 WHERE id = ?",
        [id]
      );
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
      message.edit({
        content: `❌ **PREDICTIONS ENDED FOR ${title.toUpperCase()}`,
        files: [duckImage],
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
