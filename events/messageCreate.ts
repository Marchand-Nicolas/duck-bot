import { Message } from "discord.js";
import readConfig from "../utils/readConfig";

const messageCreate = async (message: Message) => {
  const config = readConfig();
  if (config.predictionChannelId) {
    if (
      message.channelId === config.predictionChannelId &&
      !message.member?.permissions.has("ManageMessages")
    )
      message.delete();
  }
};

module.exports = messageCreate;
