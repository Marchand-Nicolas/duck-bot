import { ButtonInteraction, TextChannel } from "discord.js";
import getDbOptions from "../utils/getDbOptions";
import { createConnection } from "mysql2/promise";

const resetDb = async (interaction: ButtonInteraction) => {
  const db = await createConnection(getDbOptions());
  const [rows] = await db.execute("SELECT * FROM predictions WHERE ended = 0");
  if (!Array.isArray(rows)) return db.end();
  for (let index = 0; index < rows.length; index++) {
    const messageData = rows[index] as any;
    const channelId = messageData.channelId;
    const messageId = messageData.messageId;
    const channel = (await interaction.guild?.channels.fetch(
      channelId
    )) as TextChannel;
    if (!channel) {
      await interaction.reply({
        content: "Prediction channel not found",
        ephemeral: true,
      });
      return;
    }
    const message = await channel?.messages.fetch(messageId);
    if (!message) {
      await interaction.reply({
        content: "Prediction message not found",
        ephemeral: true,
      });
      return;
    }
    message.edit({
      content: "🦆",
      embeds: [],
      attachments: [],
    });
  }

  await db.execute("DELETE FROM predictions");
  await db.execute("DELETE FROM user_predictions");
  await db.execute("DELETE FROM user_scores");

  db.end();

  await interaction.reply({
    content: "✅ Database reset",
    ephemeral: true,
  });
};

module.exports = resetDb;
