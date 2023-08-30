const {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
} = require("discord.js");
const ExtendedClient = require("../../../class/ExtendedClient");
const UserManager = require(`../../../class/UserManager.js`);
const UserWallet = require(`../../../class/User.js`);
const { formatter } = require("../../../utils/helperFormatter.js");

module.exports = {
  structure: new SlashCommandBuilder()
    .setName("balance")
    .setDescription("Devuelve el saldo de tu billetera."),
  /**
   * @param {ExtendedClient} client
   * @param {ChatInputCommandInteraction} Interaction
   * @param {[]} args
   */
  run: async (client, Interaction, args) => {
    await Interaction.deferReply({ ephemeral: true });
    const um = new UserManager();
    try {
      const userWallet = await um.getOrCreateWallet(
        Interaction.user.username,
        Interaction.user.id
      );

      if (userWallet.adminkey) {
        const uw = new UserWallet(userWallet.adminkey);
        try {
          const userWalletDetails = await uw.getWalletDetails();

          const walletUrl = `${process.env.LNBITS_HOST}/wallet?usr=${userWallet.user}`;

          const sats = userWalletDetails.balance / 1000;

          const row = new ActionRowBuilder().addComponents([
            new ButtonBuilder()
              .setEmoji({ name: `💰` })
              .setStyle(5)
              .setLabel("Ir a mi billetera")
              .setURL(`${walletUrl}`),
          ]);

          Interaction.editReply({
            content: `Balance: ${formatter(0, 0).format(sats)} satoshis`,
            ephemeral: true,
            components: [row],
          });
        } catch (err) {
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
    }
  },
};
