import { Client, TextChannel } from "discord.js";
import readConfig from "../utils/readConfig";
import getDbOptions from "../utils/getDbOptions";
import getEveryUsersScore from "./getEveryUsersScores";
import { createConnection } from "mysql2/promise";

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
  newMessageContent += "\n\n🦆 Current predictions:\n";

  const options = getDbOptions() as any;
  // Support bigints
  options.supportBigNumbers = true;
  options.bigNumberStrings = true;
  const db = await createConnection(options);

  const [rows] = await db.execute(
    "SELECT * FROM predictions WHERE started = 1 AND ENDED = 0"
  );

  if (!Array.isArray(rows)) return db.end();

  const id = (rows[0] as any).id;

  const [userPredictions] = await db.execute(
    "SELECT * FROM user_predictions WHERE prediction_id = ?",
    [id]
  );

  db.end();
  if (!Array.isArray(userPredictions)) return db.end();

  for (let index = 0; index < userPredictions.length; index++) {
    const element = userPredictions[index] as any;
    newMessageContent += "\n";
    newMessageContent += `__${
      Math.round(element.price * 10 ** 8) / 10 ** 8
    }__ <@${element.user_id}>`;
  }

  newMessageContent +=
    "\n\n➡️ **To predict a price, use the /predict command**";

  const scores = await getEveryUsersScore();
  const keys = Object.keys(scores);

  message.edit({
    content: newMessageContent,
    embeds: [
      {
        title: "Leaderboard",
        description: keys.length
          ? keys
              .map((k) => `<@${k}>: ${scores[k]} points`)
              .sort((a, b) => {
                const aScore = parseInt(a.split(":")[1]);
                const bScore = parseInt(b.split(":")[1]);
                return bScore - aScore;
              })
              .join("\n")
          : "No scores yet",
      },
    ],
  });
};

export default refreshPredictionMessage;
