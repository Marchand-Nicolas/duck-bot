import { ModalSubmitInteraction } from "discord.js";

const editMessage = async (interaction: ModalSubmitInteraction) => {
  const interactionId = interaction.customId;
  const messageId = interactionId.split("-")[2];
  const fields = interaction.fields;
  const newMessage = fields.getTextInputValue("new-message-input");

  if (!newMessage) {
    await interaction.reply({
      content: "Invalid message. You can try again.",
      ephemeral: true,
    });
    return;
  }

  // Update message
  const channel = interaction.channel;
  if (!channel) return;
  const message = await channel.messages.fetch(messageId);
  if (!message) return;
  await message.edit(newMessage);

  await interaction.reply({
    content: "Message updated",
    ephemeral: true,
  });
};

module.exports = editMessage;
