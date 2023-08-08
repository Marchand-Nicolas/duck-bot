import { createConnection } from "mysql2/promise";
import getDbOptions from "./getDbOptions";

const getUserScore = async (userId: number) => {
  const db = await createConnection(getDbOptions());

  // Get user predictions
  const [predictions] = await db.execute(
    "SELECT * FROM user_scores WHERE user_id = ?",
    [userId]
  );

  if (!Array.isArray(predictions)) {
    await db.end();
    return 0;
  }

  let score = 0;
  for (let index = 0; index < predictions.length; index++) {
    const prediction = predictions[index] as any;
    score += prediction.score;
  }

  db.end();

  return score;
};

export default getUserScore;
