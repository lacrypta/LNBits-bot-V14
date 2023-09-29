const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const { formatter } = require("../../../utils/helperFormatter.js");
const { updateUserRank } = require("../../../handlers/donate.js");
const {
  validateAmountAndBalance,
  getFormattedWallet,
  FollowUpEphemeralResponse,
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
  run: async (client, Interaction) => {
    try {
      await Interaction.deferReply();
      const userWallet = await getFormattedWallet(
        Interaction.user.username,
        Interaction.user.id
      );

      const amount = Interaction.options.get(`monto`);

      const isValidAmount = validateAmountAndBalance(
        Number(amount?.value),
        userWallet.balance
      );

      if (!isValidAmount.status)
        return FollowUpEphemeralResponse(Interaction, isValidAmount.content);

      const outgoingInvoice = await userWallet.sdk.createOutgoingInvoice(
        process.env.POOL_ADDRESS,
        amount.value
      );

      if (outgoingInvoice && outgoingInvoice.invoice) {
        const payment = await userWallet.sdk.payInvoice(
          outgoingInvoice.invoice
        );

        if (payment) {
          const updatedRank = await updateUserRank(
            Interaction.user.id,
            "pozo",
            amount.value
          );

          const embed = new EmbedBuilder()
            .setColor(`#0099ff`)
            .setAuthor({
              name: `${Interaction.user.globalName}`,
              iconURL: `https://cdn.discordapp.com/avatars/${Interaction.user.id}/${Interaction.user.avatar}`,
            })
            .setURL(`https://wallet.lacrypta.ar`)
            .addFields(
              {
                name: `Donación a ${process.env.POOL_ADDRESS}`,
                value: `${Interaction.user.toString()} ha donado ${formatter(
                  0,
                  2
                ).format(amount.value)} satoshis al pozo!`,
              },
              {
                name: "Total donado",
                value:
                  updatedRank && updatedRank.amount
                    ? `${formatter(0, 0).format(updatedRank.amount)}`
                    : "0",
              }
            );

          return Interaction.editReply({ embeds: [embed] });
        }
      }
    } catch (err) {
      console.log(err);
      return FollowUpEphemeralResponse(Interaction, "Ocurrió un error");
    }
  },
};
