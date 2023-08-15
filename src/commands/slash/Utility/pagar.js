const {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} = require("discord.js");
const ExtendedClient = require("../../../class/ExtendedClient");

const UserManager = require(`../../../class/UserManager.js`);
const UserWallet = require(`../../../class/User.js`);

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
  run: async (client, Interaction, args) => {
    await Interaction.deferReply({ ephemeral: true });
    const um = new UserManager();

    try {
      const userWallet = await um.getUserWallet(Interaction.user.id);

      if (userWallet.adminkey) {
        const uw = new UserWallet(userWallet.adminkey);
        try {
          const payUrl = Interaction.options.get(`lnurl`).value;

          if (payUrl) {
            const payment = await uw.payInvoice(payUrl);

            if (payment)
              Interaction.editReply({
                content: `Pagaste la factura ${payUrl}`,
                ephemeral: true,
              });
          }
        } catch (err) {
          Interaction.editReply({
            content: `Ocurrió un error`,
            ephemeral: true,
          });
          console.log(err);
        }
      } else {
        Interaction.editReply({
          content: `No tienes una billetera`,
          ephemeral: true,
        });
      }
    } catch (err) {
      console.log(err);
      Interaction.editReply({
        content: `Ocurrió un error`,
        ephemeral: true,
      });
    }
  },
};
