import { Message } from "discord.js";
import getDbOptions from "../utils/getDbOptions";
import { createConnection } from "mysql2/promise";

const messageCreate = async (message: Message) => {
  const db = await createConnection(getDbOptions());
  const [rows] = await db.execute(
    "SELECT * FROM predictions WHERE channelId = ? LIMIT 1",
    [message.channelId]
  );
  db.end();
  if (!Array.isArray(rows)) return;
  if (!message.member?.permissions.has("ManageMessages")) message.delete();
};

module.exports = messageCreate;
