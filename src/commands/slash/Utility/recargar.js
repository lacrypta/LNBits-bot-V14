const {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  AttachmentBuilder,
} = require("discord.js");
const ExtendedClient = require("../../../class/ExtendedClient");
const QRCode = require(`qrcode`);

const UserManager = require(`../../../class/UserManager.js`);
const UserWallet = require(`../../../class/User.js`);

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
    let member;

    if (amount.value <= 0) {
      Interaction.reply({
        content: `No se permiten saldos negativos`,
        ephemeral: true,
      });
      return;
    }

    try {
      member = await Interaction.guild.members.fetch(Interaction.user.id);
    } catch (err) {
      console.log(err);
    }

    try {
      const um = new UserManager();
      const userWallet = await um.getUserWallet(member.user.id);

      const uw = new UserWallet(userWallet.adminkey);
      const invoiceDetails = await uw.createInvote(
        amount.value,
        `Recargar ${amount.value} sats a la billetera de discord del usuario ${member.user.username}`
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

      Interaction.editReply({
        embeds: [embed],
        files: [file],
        ephemeral: true,
      });
    } catch (err) {
      console.log(err);
      Interaction.reply({
        content: `Ocurrió un error`,
        ephemeral: true,
      });
      return;
    }
  },
};
