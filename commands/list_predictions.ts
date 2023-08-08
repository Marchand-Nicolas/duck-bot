import { CommandInteraction } from "discord.js";
import getDbOptions from "../utils/getDbOptions";
import { createConnection } from "mysql2/promise";

const deletePrediction = async (interaction: CommandInteraction) => {
  if (typeof interaction.member?.permissions === "string") return;
  if (!interaction.member?.permissions.has("Administrator")) {
    await interaction.reply({
      content:
        "You don't have permission to use this command. To predict a duck price, use the /predict command",
      ephemeral: true,
    });
    return;
  }
  const connection = await createConnection(getDbOptions());

  const [rows] = await connection.execute(
    `SELECT title, id FROM predictions ORDER BY id DESC LIMIT 10`
  );

  connection.end();

  interaction.reply({
    content: `**Showing 10 most recent predictions**\n${(rows as any)
      .map((row: any) => `__${row.id}__: ${row.title}`)
      .join("\n")}`,
    ephemeral: true,
  });
};

module.exports = {
  name: "list-predictions",
  description: "Lists all predictions.",
  execute: deletePrediction,
};
