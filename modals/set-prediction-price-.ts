import { ModalSubmitInteraction } from "discord.js";
import mysql from "mysql2/promise";
import getDbOptions from "../utils/getDbOptions";
import getUserScore from "../utils/getUserScore";
import refreshPredictionMessage from "../utils/refreshPredictionMessage";

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
  const db = await mysql.createConnection(options);

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

  let predictionScore = 3;
  const modifiedUsers: Array<any> = [];
  for (let index = 0; index < sortedPredictions.length; index++) {
    const userPrediction = sortedPredictions[index] as any;
    const pricePredicted = userPrediction.price;
    const nextPrediction = sortedPredictions[index + 1] as any;
    modifiedUsers.push(userPrediction);
    await addScore(
      userPrediction.user_id,
      predictionScore,
      userPrediction.prediction_id,
      db
    );
    if (pricePredicted !== nextPrediction?.price) predictionScore--;
  }
  db.end();

  await interaction.reply({
    content:
      "✅ All the points has been distributed.\n\n" +
      (
        await Promise.all(
          modifiedUsers.map(
            async (u) =>
              `<@${u.user_id}> has now ${(
                await getUserScore(u.user_id)
              ).toString()} points - predicted price: \`${u.price}\``
          )
        )
      ).join("\n"),
    ephemeral: true,
  });

  // Refresh prediction message
  await refreshPredictionMessage(interaction.client);
};

const addScore = async (
  userId: string,
  score: number,
  predictionId: number,
  db: mysql.Connection
) => {
  await db.execute(
    "INSERT INTO user_scores (user_id, score, prediction_id) VALUES (?, ?, ?)",
    [userId, score, predictionId]
  );
};

module.exports = setPredictionPrice;
