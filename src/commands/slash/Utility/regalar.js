const {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
} = require("discord.js");
const ExtendedClient = require("../../../class/ExtendedClient");

const Extensions = require(`../../../class/Extensions.js`);
const LNURLw = require(`../../../class/LNURLw.js`);

const { createFaucet } = require("../../../handlers/faucet.js");
const {
  validateAmountAndBalance,
  EphemeralMessageResponse,
  getFormattedWallet,
} = require("../../../utils/helperFunctions");
const { AuthorConfig } = require("../../../utils/helperConfig");

module.exports = {
  structure: new SlashCommandBuilder()
    .setName("regalar")
    .setDescription(
      "Crea una factura abierta que cualquier usuario puede reclamar (se descontará de tu saldo)"
    )
    .addNumberOption((opt) =>
      opt
        .setName("monto")
        .setDescription("La cantidad de satoshis a regalar en total")
        .setRequired(true)
    )
    .addNumberOption((opt) =>
      opt
        .setName("usos")
        .setDescription(
          "Cantidad de usuarios que pueden reclamar (cada uno recibe: total sats / users)"
        )
        .setRequired(true)
    ),
  /**
   * @param {ExtendedClient} client
   * @param {ChatInputCommandInteraction} Interaction
   * @param {[]} args
   */
  run: async (client, Interaction, args) => {
    const amount = Interaction.options.get(`monto`);
    const uses = Interaction.options.get(`usos`);

    if (!amount || !uses || amount.value <= 0 || uses.value <= 0)
      return EphemeralMessageResponse(
        Interaction,
        "No puedes usar números negativos o flotantes"
      );

    const satsForUser = Number((amount.value / uses.value).toFixed(0));

    if (satsForUser < 1)
      return EphemeralMessageResponse(
        Interaction,
        `Ocurrió un error en la división cantidad de sats / usuarios`
      );

    try {
      const userWallet = await getFormattedWallet(
        Interaction.user.username,
        Interaction.user.id
      );

      const isValidAmount = validateAmountAndBalance(
        Number(amount?.value),
        userWallet.balance
      );

      if (!isValidAmount.status)
        return EphemeralMessageResponse(Interaction, isValidAmount.content);

      await Interaction.deferReply();
      const ext = new Extensions(userWallet.user);
      await ext.enable(`withdraw`);

      const lnurlw = new LNURLw(userWallet.adminkey);
      const withdrawlLink = await lnurlw.createWithdrawlLink(
        `Regalo de ${satsForUser} sats de ${Interaction.user.username}`,
        satsForUser,
        uses.value
      );

      if (withdrawlLink) {
        const addedFaucet = await createFaucet(
          Interaction.user.id,
          withdrawlLink.id
        );

        const embed = new EmbedBuilder()
          .setAuthor(AuthorConfig)
          .addFields([
            {
              name: `Faucet disponible:`,
              value: `${Interaction.user.toString()} está regalando ${satsForUser} sats a ${
                uses.value === 1
                  ? "1 persona"
                  : `${uses.value} personas \nPresiona reclamar para obtener tu premio. \n\n`
              }`,
            },
            {
              name: `Restantes: ${satsForUser * uses.value}/${
                satsForUser * uses.value
              } sats`,
              value: `${":x:".repeat(uses.value)} \n\n`,
            },
          ])
          .setFooter({
            text: `Identificador: ${addedFaucet._id}`,
          });

        const row = new ActionRowBuilder().addComponents([
          new ButtonBuilder()
            .setCustomId("claim")
            .setLabel("Reclamar")
            .setEmoji({ name: `💸` })
            .setStyle(2),
        ]);

        Interaction.editReply({
          embeds: [embed],
          components: [row],
        });
      }
    } catch (err) {
      console.log(err);
      return EphemeralMessageResponse(Interaction, "Ocurrió un error");
    }
  },
};
