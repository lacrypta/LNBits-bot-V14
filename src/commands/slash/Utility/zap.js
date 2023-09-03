const {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
} = require("discord.js");
const ExtendedClient = require("../../../class/ExtendedClient");

const UserManager = require(`../../../class/UserManager.js`);
const UserWallet = require(`../../../class/User.js`);
const {
  validateAmountAndBalance,
  EphemeralMessageResponse,
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
  run: async (client, Interaction, args) => {
    const sender = Interaction;
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
    const senderData = await Interaction.guild.members.fetch(sender.user.id);
    const receiverData = await Interaction.guild.members.fetch(
      receiver.user.id
    );

    const _ = new UserManager();
    const senderWalletData = await _.getOrCreateWallet(
      sender.user.username,
      sender.user.id
    );
    const receiverWalletData = await _.getOrCreateWallet(
      receiverData.user.username,
      receiver.user.id
    );

    if (senderWalletData.id === receiverWalletData.id)
      return EphemeralMessageResponse(
        Interaction,
        "No puedes enviarte sats a vos mismo."
      );

    if (!senderWalletData.id)
      return EphemeralMessageResponse(
        Interaction,
        "Ocurrió un error al obtener la información del usuario"
      );

    try {
      const senderWallet = new UserWallet(senderWalletData.adminkey);
      const senderWalletDetails = await senderWallet.getWalletDetails();
      const receiverWallet = new UserWallet(receiverWalletData.adminkey);

      const isValidAmount = validateAmountAndBalance(
        Number(sats),
        senderWalletDetails.balance
      );

      if (!isValidAmount.status)
        return EphemeralMessageResponse(Interaction, isValidAmount.content);

      const invoiceDetails = await receiverWallet.createInvote(
        sats,
        message.value
      );

      const invoicePaymentDetails = await senderWallet.payInvoice(
        invoiceDetails.payment_request
      );

      if (invoicePaymentDetails) {
        await updateUserRank(Interaction.user.id, "comunidad", sats);

        await Interaction.reply({
          content: `${senderData.toString()} envió ${sats} satoshis a ${receiverData.toString()}`,
        });
      }
    } catch (err) {
      console.log(err);
      return EphemeralMessageResponse(Interaction, "Ocurrió un error");
    }
  },
};
