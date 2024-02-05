import { Client, TextChannel } from "discord.js";
import getDbOptions from "../utils/getDbOptions";
import { createConnection } from "mysql2/promise";
import computePrice from "./computePrice";
import orderPredictions from "./orderPredictions";

const refreshPredictionMessage = async (client: Client, channelId: string) => {
  const db = await createConnection(getDbOptions());
  const [rows] = await db.execute(
    "SELECT * FROM predictions WHERE started = 1 AND ENDED = 0 AND channelId = ?",
    [channelId]
  );
  if (!Array.isArray(rows)) return db.end();
  const prediction = (rows as any[])[0];
  if (!prediction) return db.end();
  const messageId = prediction.messageId;
  const channel = (await client.channels.fetch(channelId)) as TextChannel;
  if (!channel) return;

  const message = await channel?.messages.fetch(messageId);

  if (!message) return;

  const lines = message.content.split("\n");

  let newMessageContent = lines[0];

  let attachments = message.attachments.map((a) => a.url);

  const duckImage = prediction.duck_image as string;
  const title = prediction.title;
  const endDate = prediction.end_date;
  const id = prediction.id;

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

  const orderedPredictions = orderPredictions(userPredictions);

  for (let index = 0; index < orderedPredictions.length; index++) {
    const element = userPredictions[index] as any;
    newMessageContent += "\n";
    newMessageContent += `**${computePrice(element.price)} ETH** <@${
      element.user_id
    }>`;
  }

  newMessageContent += `\n\n*To predict a price, use the /predict command*`;

  message.edit({
    content: newMessageContent,
    files: attachments,
  });
};

export default refreshPredictionMessage;
