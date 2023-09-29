const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
} = require("discord.js");

const { AuthorConfig } = require("../../../utils/helperConfig");
const { formatter } = require("../../../utils/helperFormatter");
const {
  getFormattedWallet,
  FollowUpEphemeralResponse,
} = require("../../../utils/helperFunctions");

module.exports = {
  structure: new SlashCommandBuilder()
    .setName("solicitar")
    .setDescription("Solicitar que te paguen una factura")
    .addNumberOption((opt) =>
      opt
        .setName("monto")
        .setDescription("La cantidad de satoshis a pagar en la factura")
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("descripcion")
        .setDescription("La descripción de la factura")
        .setRequired(false)
    ),
  /**
   * @param {ExtendedClient} client
   * @param {ChatInputCommandInteraction} Interaction
   * @param {[]} args
   */
  run: async (client, Interaction) => {
    await Interaction.deferReply();
    const amount = Interaction.options.get(`monto`);
    const description = Interaction.options.get(`descripcion`);

    if (amount.value <= 0)
      return FollowUpEphemeralResponse(
        Interaction,
        "No se permiten saldos negativos"
      );

    try {
      const { sdk } = await getFormattedWallet(
        Interaction.user.username,
        Interaction.user.id
      );

      const invoiceDetails = await sdk.createInvote(
        amount.value,
        description ? description.value : ""
      );

      const embed = new EmbedBuilder().setAuthor(AuthorConfig).addFields([
        {
          name: `Solicitud de pago`,
          value: `${invoiceDetails.payment_request}`,
        },
        {
          name: `monto (sats)`,
          value: `${formatter(0, 0).format(amount.value)}`,
        },
      ]);

      const row = new ActionRowBuilder().addComponents([
        new ButtonBuilder()
          .setCustomId("pay")
          .setLabel("Pagar factura")
          .setEmoji({ name: `💸` })
          .setStyle(2),
      ]);

      Interaction.editReply({
        embeds: [embed],
        components: [row],
      });
    } catch (err) {
      console.log(err);
      return FollowUpEphemeralResponse(Interaction, "Ocurrió un error");
    }
  },
};
