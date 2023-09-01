const {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
} = require("discord.js");
const ExtendedClient = require("../../../class/ExtendedClient");

const UserManager = require(`../../../class/UserManager.js`);
const UserWallet = require(`../../../class/User.js`);
const { validateAmountAndBalance } = require("../../../utils/helperFunctions");
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

    if (amount.value <= 0) {
      Interaction.reply({
        content: `No se permiten saldos negativos`,
        ephemeral: true,
      });
      return;
    }

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

    if (!senderWalletData.id) {
      Interaction.reply({
        content: `Ocurrió un error`,
        ephemeral: true,
      });
      return;
    }
    const senderWallet = new UserWallet(senderWalletData.adminkey);
    const senderWalletDetails = await senderWallet.getWalletDetails();
    const receiverWallet = new UserWallet(receiverWalletData.adminkey);

    const isValidAmount = validateAmountAndBalance(
      Number(sats),
      senderWalletDetails.balance
    );

    if (isValidAmount.status) {
      try {
        // await Interaction.deferReply();
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
        await Interaction.reply({
          content: `Ocurrió un error`,
          ephemeral: true,
        });
      }
    } else {
      await Interaction.reply({
        content: isValidAmount.content,
        ephemeral: true,
      });
    }
  },
};
