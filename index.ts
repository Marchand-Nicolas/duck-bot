import Discord, {
  IntentsBitField,
  Interaction,
  REST,
  Routes,
} from "discord.js";
import fs from "fs";

require("dotenv").config();

const token = process.env.DISCORD_TOKEN;

if (!token) {
  throw new Error("Discord token is required");
}

const clientId = process.env.APP_ID;

if (!clientId) {
  throw new Error("App ID is required");
}

const client = new Discord.Client({
  intents: [],
});
client.login(token);

// Load commands
const commandFiles = fs
  .readdirSync("./commands")
  .filter((file) => file.endsWith(".ts"));
const commands = commandFiles.map((file) => require(`./commands/${file}`));

// Register commands
const rest = new REST({ version: "9" }).setToken(token);
(async () => {
  try {
    console.log("Started refreshing application (/) commands.");
    const body = commands.map((c) => {
      return {
        name: c.name,
        description: c.description,
        options: c.options,
      };
    });
    await rest.put(Routes.applicationCommands(clientId), {
      body: body,
    });
    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
})();

// Command handler
client.on("interactionCreate", async (interaction: Interaction) => {
  if (!interaction.isCommand()) return;

  const command = commands.find((c) => c.name === interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "There was an error while executing this command!",
      ephemeral: true,
    });
  }
});
