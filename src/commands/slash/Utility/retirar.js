const {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} = require("discord.js");
const ExtendedClient = require("../../../class/ExtendedClient");

const UserManager = require(`../../../class/UserManager.js`);
const UserWallet = require(`../../../class/User.js`);

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
        .setName("usos")
        .setDescription("El monto en satoshis que deseas enviar")
        .setRequired(true)
    ),
  /**
   * @param {ExtendedClient} client
   * @param {ChatInputCommandInteraction} Interaction
   * @param {[]} args
   */
  run: async (client, Interaction, args) => {
    const um = new UserManager();

    try {
      const userWallet = await um.getOrCreateWallet(
        Interaction.user.username,
        Interaction.user.id
      );

      if (userWallet.adminkey) {
        const uw = new UserWallet(userWallet.adminkey);
        const address = Interaction.options.get(`address`).value;
        const amount = Number(Interaction.options.get(`monto`).value);
        const senderWalletDetails = await uw.getWalletDetails();

        const isValidAmount = validateAmountAndBalance(
          Interaction,
          amount,
          senderWalletDetails.balance
        );

        try {
          if (isValidAmount) {
            const invoice = await uw.createOutgoingInvoice(address, amount);
            if (invoice && invoice.invoice) {
              const payment = await uw.payInvoice(invoice.invoice);

              if (payment) {
                Interaction.reply({
                  content: `Enviaste ${amount} satoshis a ${address} desde tu billetera`,
                  ephemeral: true,
                });
              }
            }
          }
        } catch (err) {
          Interaction.reply({
            content: `Ocurrió un error`,
            ephemeral: true,
          });
          console.log(err);
        }
      } else {
        Interaction.reply({
          content: `No tienes una billetera`,
          ephemeral: true,
        });
      }
    } catch (err) {
      console.log(err);
      Interaction.reply({
        content: `Ocurrió un error`,
        ephemeral: true,
      });
    }
  },
};
