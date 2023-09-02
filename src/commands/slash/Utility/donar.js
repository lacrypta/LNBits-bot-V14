const {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
} = require("discord.js");
const ExtendedClient = require("../../../class/ExtendedClient");

const UserManager = require(`../../../class/UserManager.js`);
const UserWallet = require(`../../../class/User.js`);
const { formatter } = require("../../../utils/helperFormatter.js");
const { updateUserRank } = require("../../../handlers/donate.js");
const { AuthorConfig } = require("../../../utils/helperConfig.js");
const {
  validateAmountAndBalance,
  EphemeralMessageResponse,
} = require("../../../utils/helperFunctions.js");

module.exports = {
  structure: new SlashCommandBuilder()
    .setName("donar")
    .setDescription("Realiza donaciones al pozo de la crypta.")
    .addNumberOption((opt) =>
      opt
        .setName("monto")
        .setDescription("La cantidad de satoshis a donar")
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
      const senderData = await Interaction.guild.members.fetch(
        Interaction.user.id
      );
      const userWallet = await um.getOrCreateWallet(
        Interaction.user.username,
        Interaction.user.id
      );

      const uw = new UserWallet(userWallet.adminkey);

      const userWalletDetails = await uw.getWalletDetails();
      const amount = Interaction.options.get(`monto`);

      const isValidAmount = validateAmountAndBalance(
        Number(amount?.value),
        userWalletDetails.balance
      );

      if (!isValidAmount.status)
        return EphemeralMessageResponse(Interaction, isValidAmount.content);

      await Interaction.deferReply();

      const outgoingInvoice = await uw.createOutgoingInvoice(
        process.env.POOL_ADDRESS,
        amount.value
      );

      if (outgoingInvoice && outgoingInvoice.invoice) {
        const payment = await uw.payInvoice(outgoingInvoice.invoice);

        if (payment) {
          const updatedRank = await updateUserRank(
            Interaction.user.id,
            "pozo",
            amount.value
          );

          const embed = new EmbedBuilder()
            .setColor(`#0099ff`)
            .setAuthor(AuthorConfig)
            .setURL(`https://wallet.lacrypta.ar`)
            .addFields(
              {
                name: `Donación a ${process.env.POOL_ADDRESS}`,
                value: `${senderData.toString()} ha donado ${formatter(
                  0,
                  2
                ).format(amount.value)} satoshis al pozo!`,
              },
              {
                name: "Total donado",
                value:
                  updatedRank && updatedRank.amount
                    ? `${updatedRank.amount}`
                    : "0",
              }
            );

          Interaction.editReply({ embeds: [embed] });
          return;
        }
      }
    } catch (err) {
      console.log(err);
      return EphemeralMessageResponse(Interaction, "Ocurrió un error");
    }
  },
};
