import { Client, Interaction, REST, Routes } from "discord.js";
import * as fs from "fs";
import startCron from "./cron";
import path from "path";

require("dotenv").config();

const token = process.env.DISCORD_TOKEN;

if (!token) {
  throw new Error("Discord token is required");
}

const clientId = process.env.APP_ID;

if (!clientId) {
  throw new Error("App ID is required");
}

const client = new Client({
  intents: ["Guilds", "GuildMessages"],
});
client.login(token);

// Load commands
const commandFiles = fs
  .readdirSync(path.join(__dirname, "./commands"))
  .filter((file) => file.endsWith(".ts") || file.endsWith(".js"));
const commands = commandFiles.map((file) =>
  require(path.join(__dirname, `./commands/${file}`))
);

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

const buttonFiles = fs
  .readdirSync(path.join(__dirname, "./buttons"))
  .filter((file) => file.endsWith(".ts") || file.endsWith(".js"));
const buttons = buttonFiles.map((file) =>
  require(path.join(__dirname, `./buttons/${file}`))
);

const modalFiles = fs
  .readdirSync(path.join(__dirname, "./modals"))
  .filter((file) => file.endsWith(".ts") || file.endsWith(".js"));
const modals = modalFiles.map((file) =>
  require(path.join(__dirname, `./modals/${file}`))
);

// Command handler
client.on("interactionCreate", async (interaction: Interaction) => {
  if (interaction.isCommand()) {
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
  } else if (interaction.isButton()) {
    for (let index = 0; index < buttonFiles.length; index++) {
      const buttonName = buttonFiles[index]
        .replace(".ts", "")
        .replace(".js", "");
      if (interaction.customId.startsWith(buttonName))
        buttons[index](interaction);
    }
  } else if (interaction.isModalSubmit()) {
    for (let index = 0; index < modalFiles.length; index++) {
      const modalName = modalFiles[index].replace(".ts", "").replace(".js", "");
      if (interaction.customId.startsWith(modalName))
        modals[index](interaction);
    }
  }
});

client.on("ready", () => {
  // Start cron
  startCron(client);
});

// Load events
const eventsFiles = fs
  .readdirSync(path.join(__dirname, "./events"))
  .filter((file) => file.endsWith(".ts") || file.endsWith(".js"));
const events = eventsFiles.map((file) =>
  require(path.join(__dirname, `./events/${file}`))
);
for (let index = 0; index < eventsFiles.length; index++) {
  const eventName = eventsFiles[index].replace(".ts", "").replace(".js", "");
  console.log(`Registering event: ${eventName}`);
  client.on(eventName, events[index]);
}
