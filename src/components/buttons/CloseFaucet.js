const { ActionRowBuilder, ButtonBuilder, EmbedBuilder } = require("discord.js");
const LNURLw = require("../../class/LNURLw.js");
const { getFaucet, closeFaucet } = require("../../handlers/faucet.js");
const { AuthorConfig } = require("../../utils/helperConfig.js");

const {
  EphemeralMessageResponse,
  getFormattedWallet,
} = require("../../utils/helperFunctions.js");

/*
This command will claim a LNurl
*/
module.exports = {
  customId: "closefaucet",
  /**
   *
   * @param {ExtendedClient} client
   * @param {ButtonInteraction} Interaction
   */
  run: async (client, Interaction) => {
    const footerContent = Interaction.message.embeds[0]?.footer?.text;
    const faucetSubStr = footerContent ? footerContent.indexOf(" ") : -1;

    const faucetId =
      faucetSubStr !== -1
        ? footerContent.substring(faucetSubStr + 1, footerContent.length)
        : false;

    if (faucetId) {
      const faucet = await getFaucet(faucetId);

      if (faucet && faucet.discord_id !== Interaction.user.id)
        return EphemeralMessageResponse(
          Interaction,
          "No puedes cerrar un faucet que no te pertenece"
        );

      try {
        const userWallet = await getFormattedWallet(
          Interaction.user.username,
          Interaction.user.id
        );

        const lnurlw = new LNURLw(userWallet.adminkey);
        const deletedLink = await lnurlw.deleteWithdrawLink(
          faucet.withdraw_id,
          Interaction.user.id
        );

        await Interaction.deferReply({ ephemeral: true });

        if (deletedLink && deletedLink.success) {
          const closedFaucet = await closeFaucet(faucetId);

          if (closedFaucet) {
            const fieldsInfo = Interaction.message.embeds[0].fields;

            const embed = new EmbedBuilder()
              .setAuthor(AuthorConfig)
              .addFields(fieldsInfo)
              .setFooter({
                text: `Identificador: ${faucetId}`,
              });

            const row = new ActionRowBuilder().addComponents([
              new ButtonBuilder()
                .setCustomId("closefaucet")
                .setLabel("El faucet ha sido cerrado por su autor")
                .setEmoji({ name: `✖️` })
                .setStyle(2)
                .setDisabled(true),
            ]);

            await Interaction.message.edit({
              embeds: [embed],
              components: [row],
            });

            return EphemeralMessageResponse(
              Interaction,
              "Cerraste el faucet exitosamente"
            );
          }
        }

        EphemeralMessageResponse(Interaction, "Ocurrió un error.");
      } catch (err) {
        console.log(err);
        EphemeralMessageResponse(Interaction, "Ocurrió un error.");
      }
    }
  },
};
