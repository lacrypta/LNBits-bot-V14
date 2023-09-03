const {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  AttachmentBuilder,
} = require("discord.js");
const ExtendedClient = require("../../../class/ExtendedClient");
const QRCode = require(`qrcode`);

const {
  EphemeralMessageResponse,
  getFormattedWallet,
} = require("../../../utils/helperFunctions");

module.exports = {
  structure: new SlashCommandBuilder()
    .setName("recargar")
    .setDescription("Recarga tu cuenta de lightning network con una factura")
    .addNumberOption((opt) =>
      opt
        .setName("monto")
        .setDescription("La cantidad de satoshis a pagar en la factura")
        .setRequired(true)
    ),
  /**
   * @param {ExtendedClient} client
   * @param {ChatInputCommandInteraction} Interaction
   * @param {[]} args
   */
  run: async (client, Interaction, args) => {
    await Interaction.deferReply({ ephemeral: true });
    const amount = Interaction.options.get(`monto`);

    if (amount.value <= 0)
      return EphemeralMessageResponse(
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
        `Recargar ${amount.value} sats a la billetera de discord del usuario ${Interaction.user.username}`
      );

      const qrData = await QRCode.toDataURL(invoiceDetails.payment_request);
      const buffer = new Buffer.from(qrData.split(`,`)[1], `base64`);
      const file = new AttachmentBuilder(buffer, `image.png`);
      const embed = new EmbedBuilder()
        .setImage(`attachment://image.png`)
        .addFields([
          {
            name: `Solicitud de pago`,
            value: `${invoiceDetails.payment_request}`,
          },
          {
            name: "monto",
            value: `${amount.value}`,
          },
        ]);

      return Interaction.editReply({
        embeds: [embed],
        files: [file],
        ephemeral: true,
      });
    } catch (err) {
      console.log(err);
      return EphemeralMessageResponse(Interaction, "Ocurrió un error");
    }
  },
};
