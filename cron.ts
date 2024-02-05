import { Client, TextChannel } from "discord.js";
import getDbOptions from "./utils/getDbOptions";
import { createConnection } from "mysql2/promise";
import refreshPredictionMessage from "./utils/refreshPredictionMessage";
import computePrice from "./utils/computePrice";
import orderPredictions from "./utils/orderPredictions";

const startCron = (client: Client) => {
  refresh(client);
  setInterval(() => refresh(client), 1000);
};

const refresh = async (client: Client) => {
  const db = await createConnection(getDbOptions());

  const [rows, fields] = await db.execute(
    "SELECT * FROM predictions WHERE ended = 0"
  );

  if (!Array.isArray(rows)) return db.end();

  for (let index = 0; index < rows.length; index++) {
    const prediction = rows[index] as any;
    const id = prediction.id;
    const started = prediction.started;
    const ended = prediction.ended;
    const endDate = new Date(prediction.end_date);
    const now = new Date();
    const startDate = new Date(prediction.start_date);
    const title = prediction.title;
    const endImage = prediction.end_image as string;
    const channelId = prediction.channelId;
    const messageId = prediction.messageId;
    if (!channelId || !messageId) continue;
    const channel = (await client.channels.fetch(channelId)) as TextChannel;
    if (!channel) continue;
    const message = await channel.messages
      .fetch(messageId)
      .catch((e) => console.log(e));
    if (!message) continue;
    // Check if prediction has started
    if (started === 0 && startDate.getTime() <= now.getTime() && ended === 0) {
      await db.execute("UPDATE predictions SET started = 1 WHERE id = ?", [id]);
      await refreshPredictionMessage(client, channelId);
      continue;
    }
    // Check if prediction has ended
    if (endDate.getTime() <= now.getTime() && ended === 0) {
      const [userPredictions] = await db.execute(
        "SELECT * FROM user_predictions WHERE prediction_id = ?",
        [id]
      );
      if (!Array.isArray(userPredictions)) return;
      let newMessageContent = `**~ PREDICTIONS FOR ${title.toUpperCase()} ARE NOW CLOSED ~**`;
      if (userPredictions.length) newMessageContent += "\n\n**Predictions:**\n";

      const orderedPredictions = orderPredictions(userPredictions);

      for (let index = 0; index < orderedPredictions.length; index++) {
        const element = orderedPredictions[index] as any;
        newMessageContent += "\n";
        newMessageContent += `**${computePrice(element.price)} ETH** <@${
          element.user_id
        }>`;
      }
      message.edit({
        content: newMessageContent,
        files: [endImage],
      });
      await db.execute("UPDATE predictions SET ended = 1 WHERE id = ?", [id]);
      continue;
    }
  }
  db.end();
};

export default startCron;
