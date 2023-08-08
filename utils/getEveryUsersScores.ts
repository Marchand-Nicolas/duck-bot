import { createConnection } from "mysql2/promise";
import getDbOptions from "./getDbOptions";

const getEveryUsersScore = async () => {
  const options = getDbOptions() as any;
  // Support bigints
  options.supportBigNumbers = true;
  options.bigNumberStrings = true;
  const db = await createConnection(options);

  // Get user predictions
  const [predictions] = await db.execute("SELECT * FROM user_scores");

  if (!Array.isArray(predictions)) {
    await db.end();
    return {};
  }

  const scores: { [key: string]: number } = {};
  for (let index = 0; index < predictions.length; index++) {
    const prediction = predictions[index] as any;
    const key = prediction.user_id as keyof typeof scores;
    if (scores[key]) scores[key] += prediction.score;
    else scores[key] = prediction.score;
  }

  db.end();

  return scores;
};

export default getEveryUsersScore;