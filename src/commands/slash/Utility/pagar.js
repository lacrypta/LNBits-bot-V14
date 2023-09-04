const { SlashCommandBuilder } = require("discord.js");

const {
  EphemeralMessageResponse,
  getFormattedWallet,
} = require("../../../utils/helperFunctions");

module.exports = {
  structure: new SlashCommandBuilder()
    .setName("pagar")
    .setDescription("Paga una factura de lightning network")
    .addStringOption((opt) =>
      opt
        .setName("lnurl")
        .setDescription("LNURL de la factura que quieres pagar")
        .setRequired(true)
    ),
  /**
   * @param {ExtendedClient} client
   * @param {ChatInputCommandInteraction} Interaction
   * @param {[]} args
   */
  run: async (client, Interaction) => {
    await Interaction.deferReply({ ephemeral: true });

    try {
      const { sdk } = await getFormattedWallet(
        Interaction.user.username,
        Interaction.user.id
      );

      const payUrl = Interaction.options.get(`lnurl`).value;

      if (payUrl) {
        const payment = await sdk.payInvoice(payUrl);

        if (payment)
          Interaction.editReply({
            content: `Pagaste la factura ${payUrl}`,
            ephemeral: true,
          });
      }
    } catch (err) {
      console.log(err);
      EphemeralMessageResponse(Interaction, "Ocurrió un error");
    }
  },
};
