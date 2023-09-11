const { SlashCommandBuilder } = require("discord.js");

const {
  validateAmountAndBalance,
  EphemeralMessageResponse,
  getFormattedWallet,
} = require("../../../utils/helperFunctions");
const { updateUserRank } = require("../../../handlers/donate");

module.exports = {
  structure: new SlashCommandBuilder()
    .setName("zap")
    .setDescription("Regala sats a un usuario en discord")
    .addUserOption((opt) =>
      opt.setName("user").setDescription("Usuario a zappear").setRequired(true)
    )
    .addNumberOption((opt) =>
      opt
        .setName("monto")
        .setDescription("La cantidad de satoshis a transferir")
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("message")
        .setDescription("Un mensaje de la transferencia")
        .setRequired(false)
    ),
  /**
   * @param {ExtendedClient} client
   * @param {ChatInputCommandInteraction} Interaction
   * @param {[]} args
   */
  run: async (client, Interaction) => {
    const receiver = Interaction.options.get(`user`);
    const amount = Interaction.options.get(`monto`);
    const message = Interaction.options.get(`message`)
      ? Interaction.options.get(`message`)
      : { value: `Envío de sats vía La Crypta` };

    if (amount.value <= 0)
      return EphemeralMessageResponse(
        Interaction,
        "No se permiten saldos negativos"
      );

    const sats = amount.value;

    try {
      const receiverData = await Interaction.guild.members.fetch(
        receiver.user.id
      );

      const senderWallet = await getFormattedWallet(
        Interaction.user.username,
        Interaction.user.id
      );

      const receiverWallet = await getFormattedWallet(
        receiverData.user.username,
        receiverData.user.id
      );

      if (!senderWallet.id || !receiverWallet.id)
        return EphemeralMessageResponse(
          Interaction,
          "Ocurrió un error al obtener la información del usuario"
        );

      if (senderWallet.id === receiverWallet.id)
        return EphemeralMessageResponse(
          Interaction,
          "No puedes enviarte sats a vos mismo."
        );

      const isValidAmount = validateAmountAndBalance(
        Number(sats),
        senderWallet.balance
      );

      if (!isValidAmount.status)
        return EphemeralMessageResponse(Interaction, isValidAmount.content);

      const invoiceDetails = await receiverWallet.sdk.createInvote(
        sats,
        message.value
      );

      const invoicePaymentDetails = await senderWallet.sdk.payInvoice(
        invoiceDetails.payment_request
      );

      if (invoicePaymentDetails) {
        await updateUserRank(Interaction.user.id, "comunidad", sats);

        await Interaction.reply({
          content: `${Interaction.user.toString()} envió ${sats} satoshis a ${receiverData.toString()}`,
        });
      }
    } catch (err) {
      console.log(err);
      return EphemeralMessageResponse(Interaction, "Ocurrió un error");
    }
  },
};
