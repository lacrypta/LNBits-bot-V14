const { SlashCommandBuilder } = require("discord.js");

const {
  validateAmountAndBalance,
  getFormattedWallet,
  FollowUpEphemeralResponse,
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
    try {
      Interaction.deferReply({ ephemeral: true });
      const receiver = Interaction.options.get(`user`);
      const amount = Interaction.options.get(`monto`);

      if (amount.value <= 0)
        return FollowUpEphemeralResponse(
          Interaction,
          "No se permiten saldos negativos"
        );

      const sats = amount.value;

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
        return FollowUpEphemeralResponse(
          Interaction,
          "Ocurrió un error al obtener la información del usuario"
        );

      if (senderWallet.id === receiverWallet.id)
        return FollowUpEphemeralResponse(
          Interaction,
          "No puedes enviarte sats a vos mismo."
        );

      const isValidAmount = validateAmountAndBalance(
        Number(sats),
        senderWallet.balance
      );

      if (!isValidAmount.status)
        return FollowUpEphemeralResponse(Interaction, isValidAmount.content);

      const message = Interaction.options.get(`message`)
        ? Interaction.options.get(`message`)
        : {
            value: `${senderWallet.user.username} te envío ${sats} sats a través de discord`,
          };

      const invoiceDetails = await receiverWallet.sdk.createInvote(
        sats,
        message.value
      );

      const invoicePaymentDetails = await senderWallet.sdk.payInvoice(
        invoiceDetails.payment_request
      );

      if (invoicePaymentDetails) {
        await updateUserRank(Interaction.user.id, "comunidad", sats);

        await Interaction.deleteReply();
        await Interaction.followUp({
          content: `${Interaction.user.toString()} envió ${sats} satoshis a ${receiverData.toString()}`,
        });
      }
    } catch (err) {
      console.log(err);
      return FollowUpEphemeralResponse(Interaction, "Ocurrió un error");
    }
  },
};
