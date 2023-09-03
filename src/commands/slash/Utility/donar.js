const {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
} = require("discord.js");
const ExtendedClient = require("../../../class/ExtendedClient");

const { formatter } = require("../../../utils/helperFormatter.js");
const { updateUserRank } = require("../../../handlers/donate.js");
const { AuthorConfig } = require("../../../utils/helperConfig.js");
const {
  validateAmountAndBalance,
  EphemeralMessageResponse,
  getFormattedWallet,
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
    try {
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
        return EphemeralMessageResponse(Interaction, isValidAmount.content);

      await Interaction.deferReply();

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
            .setAuthor(AuthorConfig)
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
