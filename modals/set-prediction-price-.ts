import { ModalSubmitInteraction, TextChannel } from "discord.js";
import getDbOptions from "../utils/getDbOptions";
import { Connection, createConnection } from "mysql2/promise";
import computePrice from "../utils/computePrice";
import readConfig from "../utils/readConfig";
import getEveryUsersScore from "../utils/getEveryUsersScores";

const setPredictionPrice = async (interaction: ModalSubmitInteraction) => {
  const interactionId = interaction.customId;
  const predictionId = interactionId.split("-")[3];
  const fields = interaction.fields;
  const price = parseFloat(fields.getTextInputValue("price-input"));

  if (isNaN(price) || price <= 0) {
    await interaction.reply({
      content: "Invalid price. You can try again.",
      ephemeral: true,
    });
    return;
  }

  const options = getDbOptions() as any;
  // Support bigints
  options.supportBigNumbers = true;
  options.bigNumberStrings = true;
  const db = await createConnection(options);

  // Get user predictions
  const [predictions] = await db.execute(
    "SELECT * FROM user_predictions WHERE prediction_id = ?",
    [predictionId]
  );

  if (!Array.isArray(predictions)) {
    await interaction.reply({
      content: "Error getting predictions",
      ephemeral: true,
    });
    return db.end();
  }

  // Update prediction price
  await db.execute("UPDATE predictions SET price = ? WHERE id = ?", [
    price,
    predictionId,
  ]);

  // Order predictions by price proximity
  const sortedPredictions = predictions.sort(
    (a: any, b: any) => Math.abs(a.price - price) - Math.abs(b.price - price)
  );

  let rank = 0;
  const rewards = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
  const modifiedUsers: Array<any> = [];
  for (let index = 0; index < sortedPredictions.length; index++) {
    const userPrediction = sortedPredictions[index] as any;
    const pricePredicted = computePrice(userPrediction.price);
    const nextPrediction = sortedPredictions[index + 1] as any;
    const reward = rewards[rank] || 0;
    modifiedUsers.push({
      userId: userPrediction.user_id,
      reward,
    });
    if (reward)
      await addScore(
        userPrediction.user_id,
        reward,
        userPrediction.prediction_id,
        db
      );
    if (pricePredicted !== computePrice(nextPrediction?.price)) rank++;
  }
  db.end();

  const scores = await getEveryUsersScore();
  const keys = Object.keys(scores);

  const leaderboard = keys.length
    ? keys
        .sort((a, b) => {
          const aScore = parseInt(a.split(":")[1]);
          const bScore = parseInt(b.split(":")[1]);
          return bScore - aScore;
        })
        .map(
          (k, index) =>
            `> **${index + 1}**. <@${k}>: **${scores[k]} points** ${
              modifiedUsers.find((u) => u.userId === k)?.reward
                ? "(+" +
                  modifiedUsers.find((u) => u.userId === k)?.reward.toString() +
                  ")"
                : ""
            }`
        )
        .join("\n")
    : "> No scores yet";

  const config = readConfig();

  if (!config.predictionChannelId) return;

  const channel = (await interaction.client.channels.fetch(
    config.predictionChannelId
  )) as TextChannel;

  if (!channel) return;

  channel.send("> **LEADERBOARD**\n> \n" + leaderboard);

  await interaction.reply({
    content: "✅ All the points has been distributed.",
    ephemeral: true,
  });
};

const addScore = async (
  userId: string,
  score: number,
  predictionId: number,
  db: Connection
) => {
  await db.execute(
    "INSERT INTO user_scores (user_id, score, prediction_id) VALUES (?, ?, ?)",
    [userId, score, predictionId]
  );
};

module.exports = setPredictionPrice;
