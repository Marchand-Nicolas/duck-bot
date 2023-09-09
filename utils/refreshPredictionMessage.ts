import { Client, TextChannel } from "discord.js";
import readConfig from "../utils/readConfig";
import getDbOptions from "../utils/getDbOptions";
import { createConnection } from "mysql2/promise";
import computePrice from "./computePrice";

const refreshPredictionMessage = async (client: Client) => {
  const config = readConfig();

  if (!config.predictionChannelId) return;

  const channel = (await client.channels.fetch(
    config.predictionChannelId
  )) as TextChannel;

  if (!channel) return;

  const message = await channel?.messages.fetch(config.predictionMessageId);

  if (!message) return;

  const lines = message.content.split("\n");

  let newMessageContent = lines[0];

  let attachments = message.attachments.map((a) => a.url);

  const db = await createConnection(getDbOptions());

  const [rows] = await db.execute(
    "SELECT * FROM predictions WHERE started = 1 AND ended = 0"
  );

  if (!Array.isArray(rows)) return db.end();
  if (rows.length) {
    const row = rows[0] as any;
    const duckImage = row.duck_image as string;
    const title = row.title;
    const endDate = row.end_date;
    const id = row.id;

    attachments = [duckImage];
    newMessageContent = `**~ MAKE YOUR PREDICTION FOR ${title.toUpperCase()} ~**
\ \ \ \`Predictions will close \`<t:${Math.floor(endDate.getTime() / 1000)}:R>`;

    const [userPredictions] = await db.execute(
      "SELECT * FROM user_predictions WHERE prediction_id = ?",
      [id]
    );

    db.end();
    if (!Array.isArray(userPredictions)) return db.end();

    if (userPredictions.length)
      newMessageContent += "\n\n**Current predictions:**\n";

    // DESC
    const orderedPredictions = userPredictions.sort(
      (a: any, b: any) => computePrice(b.price) - computePrice(a.price)
    );

    for (let index = 0; index < orderedPredictions.length; index++) {
      const element = userPredictions[index] as any;
      newMessageContent += "\n";
      newMessageContent += `**${computePrice(element.price)} ETH** <@${
        element.user_id
      }>`;
    }

    newMessageContent += `\n\n*To predict a price, use the /predict command*`;
  } else db.end();

  message.edit({
    content: newMessageContent,
    files: attachments,
  });
};

export default refreshPredictionMessage;
