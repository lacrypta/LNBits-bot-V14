const {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
} = require("discord.js");
const ExtendedClient = require("../../../class/ExtendedClient");

const UserManager = require(`../../../class/UserManager.js`);
const UserWallet = require(`../../../class/User.js`);
const { AuthorConfig } = require("../../../utils/helperConfig");

module.exports = {
  structure: new SlashCommandBuilder()
    .setName("solicitar")
    .setDescription("Solicitar que te paguen una factura")
    .addNumberOption((opt) =>
      opt
        .setName("monto")
        .setDescription("La cantidad de satoshis a pagar en la factura")
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("descripcion")
        .setDescription("La descripción de la factura")
        .setRequired(false)
    ),
  /**
   * @param {ExtendedClient} client
   * @param {ChatInputCommandInteraction} Interaction
   * @param {[]} args
   */
  run: async (client, Interaction, args) => {
    const amount = Interaction.options.get(`monto`);
    const description = Interaction.options.get(`descripcion`);
    let member;

    if (amount.value <= 0) {
      Interaction.reply({
        content: `No se permiten saldos negativos`,
        ephemeral: true,
      });
      return;
    }

    await Interaction.deferReply();
    try {
      member = await Interaction.guild.members.fetch(Interaction.user.id);
    } catch (err) {
      console.log(err);
    }

    try {
      const um = new UserManager();
      const userWallet = await um.getOrCreateWallet(
        member.user.username,
        member.user.id
      );

      const uw = new UserWallet(userWallet.adminkey);
      const invoiceDetails = await uw.createInvote(
        amount.value,
        description ? description.value : ""
      );

      const embed = new EmbedBuilder().setAuthor(AuthorConfig).addFields([
        {
          name: `Solicitud de pago`,
          value: `${invoiceDetails.payment_request}`,
        },
        {
          name: `monto (sats)`,
          value: `${amount.value}`,
        },
      ]);

      const row = new ActionRowBuilder().addComponents([
        new ButtonBuilder()
          .setCustomId("pay")
          .setLabel("Pagar factura")
          .setEmoji({ name: `💸` })
          .setStyle(2),
      ]);

      Interaction.editReply({
        embeds: [embed],
        components: [row],
      });
    } catch (err) {
      console.log(err);
      Interaction.editReply({
        content: `Ocurrió un error`,
        ephemeral: true,
      });
    }
  },
};
