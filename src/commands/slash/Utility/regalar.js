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
const UserManager = require(`../../../class/UserManager.js`);
const UserWallet = require(`../../../class/User.js`);
const { createFaucet } = require("../../../handlers/faucet.js");
const { validateAmountAndBalance } = require("../../../utils/helperFunctions");
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

    let member;

    if (!amount || !uses || amount.value <= 0 || uses.value <= 0) {
      Interaction.reply({
        content: `No puedes usar números negativos o flotantes`,
        ephemeral: true,
      });
      return;
    }
    const satsForUser = Number((amount.value / uses.value).toFixed(0));

    if (satsForUser < 1) {
      Interaction.reply({
        content: `Ocurrió un error en la división cantidad de sats / usuarios`,
        ephemeral: true,
      });
      return;
    }
    try {
      member = await Interaction.guild.members.fetch(Interaction.user.id);
    } catch (err) {
      console.log(err);
    }

    try {
      const um = new UserManager();
      const userWallet = await um.getOrCreateWallet(
        Interaction.user.username,
        Interaction.user.id
      );

      const uw = new UserWallet(userWallet.adminkey);
      const userWalletDetails = await uw.getWalletDetails();

      const isValidAmount = validateAmountAndBalance(
        Number(amount?.value),
        userWalletDetails.balance
      );

      if (isValidAmount.status) {
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
            member.user.id,
            withdrawlLink.id
          );

          const embed = new EmbedBuilder()
            .setAuthor(AuthorConfig)
            .addFields([
              {
                name: `Faucet disponible:`,
                value: `${member.toString()} está regalando ${satsForUser} sats a ${
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
      } else {
        Interaction.reply({
          content: isValidAmount.content,
          ephemeral: true,
        });
      }
    } catch (err) {
      console.log(err);
      Interaction.deferred
        ? Interaction.editReply({
            content: `Ocurrió un error`,
          })
        : Interaction.reply({
            content: "Ocurrio un error",
          });
    }
  },
};
