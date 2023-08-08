import {
  ActionRowBuilder,
  ButtonInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";

const setPredictionPrice = async (interaction: ButtonInteraction) => {
  const interactionId = interaction.customId;

  // Show a prompt to enter the price
  const modal = new ModalBuilder()
    .setCustomId(interactionId)
    .setTitle("Set duck price");

  const priceInput = new TextInputBuilder()
    .setCustomId("price-input")
    .setLabel("Duck price (float)")
    .setStyle(TextInputStyle.Short);

  const actionRow = new ActionRowBuilder().addComponents(priceInput);

  modal.addComponents(actionRow as any);

  await interaction.showModal(modal);
};

module.exports = setPredictionPrice;
