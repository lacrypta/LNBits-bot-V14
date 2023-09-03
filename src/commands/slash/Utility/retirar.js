const {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} = require("discord.js");
const ExtendedClient = require("../../../class/ExtendedClient");

const {
  validateAmountAndBalance,
  EphemeralMessageResponse,
  getFormattedWallet,
} = require("../../../utils/helperFunctions");

module.exports = {
  structure: new SlashCommandBuilder()
    .setName("retirar")
    .setDescription("Retira satoshis a una cuenta externa a discord")
    .addStringOption((opt) =>
      opt
        .setName("address")
        .setDescription("dirección de lightning network")
        .setRequired(true)
    )
    .addNumberOption((opt) =>
      opt
        .setName("monto")
        .setDescription("El monto en satoshis que deseas enviar")
        .setRequired(true)
    ),
  /**
   * @param {ExtendedClient} client
   * @param {ChatInputCommandInteraction} Interaction
   * @param {[]} args
   */
  run: async (client, Interaction, args) => {
    await Interaction.deferReply({ ephemeral: true });

    try {
      const address = Interaction.options.get(`address`).value;
      const amount = Number(Interaction.options.get(`monto`).value);

      const userWallet = await getFormattedWallet(
        Interaction.user.username,
        Interaction.user.id
      );

      const isValidAmount = validateAmountAndBalance(
        amount,
        userWallet.balance
      );

      if (!isValidAmount.status)
        return EphemeralMessageResponse(Interaction, isValidAmount.content);

      const invoice = await userWallet.sdk.createOutgoingInvoice(
        address,
        amount
      );

      if (invoice && invoice.invoice) {
        const payment = await userWallet.sdk.payInvoice(invoice.invoice);

        if (payment) {
          Interaction.editReply({
            content: `Enviaste ${amount} satoshis a ${address} desde tu billetera`,
            ephemeral: true,
          });
        }
      }
    } catch (err) {
      console.log(err);
      return EphemeralMessageResponse(
        Interaction,
        "Ocurrió un error. Los parámetros de este comando son <ln url o address> y <monto>. Si deseas pagar una factura utiliza el comando /pagar"
      );
    }
  },
};
