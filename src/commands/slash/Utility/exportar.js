const {
  SlashCommandBuilder,
  EmbedBuilder,
  AttachmentBuilder,
} = require("discord.js");

const {
  EphemeralMessageResponse,
  getFormattedWallet,
} = require("../../../utils/helperFunctions");
const QRCode = require("qrcode");
const Extensions = require("../../../class/Extensions");

module.exports = {
  structure: new SlashCommandBuilder()
    .setName("exportar")
    .setDescription(
      "Exporta tu billetera para conectarla con Zeus o BlueWallet"
    ),
  /**
   * @param {ExtendedClient} client
   * @param {ChatInputCommandInteraction} Interaction
   * @param {[]} args
   */
  run: async (client, Interaction) => {
    await Interaction.deferReply({ ephemeral: true });

    try {
      const userWallet = await getFormattedWallet(
        Interaction.user.username,
        Interaction.user.id
      );

      const ext = new Extensions(userWallet.user);
      await ext.enable(`lndhub`);

      const qrData = await QRCode.toDataURL(
        `lndhub://admin:${userWallet.adminkey}@${process.env.LNBITS_HOST}/lndhub/ext/`
      );
      const buffer = new Buffer.from(qrData.split(`,`)[1], `base64`);
      const file = new AttachmentBuilder(buffer, `image.png`);
      const embed = new EmbedBuilder()
        .setImage(`attachment://image.png`)
        .addFields([
          {
            name: `Exportar billetera`,
            value:
              "Debes escanear el código QR desde tu celular con la aplicación de Blue Wallet o Zeus para importar tu billetera en la aplicación mobile.",
          },
        ]);

      return Interaction.editReply({
        embeds: [embed],
        files: [file],
        ephemeral: true,
      });
    } catch (err) {
      console.log(err);
      EphemeralMessageResponse(Interaction, "Ocurrió un error");
    }
  },
};
