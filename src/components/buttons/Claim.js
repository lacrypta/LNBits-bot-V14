const Discord = require(`discord.js`);
const LNURL = require(`../../class/LNURLw`);
const LNURLw = require("../../class/LNURLw");

const { updateUserRank } = require("../../handlers/donate.js");
const { getFaucet, updateFaucet } = require("../../handlers/faucet.js");
const { AuthorConfig } = require("../../utils/helperConfig.js");
const dedent = require("dedent-js");
const {
  EphemeralMessageResponse,
  getFormattedWallet,
} = require("../../utils/helperFunctions.js");
const { getFormattedRoleLists } = require("../../handlers/lists");

const usersClaiming = {};
const faucetDebouncedUpdate = {};

async function update(faucet_id, fieldInfo, withdrawLink, message) {
  const faucet = await getFaucet(faucet_id);
  const newUsed = faucet.claimers_ids.length;

  let claimersOutput = ``;
  faucet.claimers_ids.forEach(async (claimer) => {
    claimersOutput += `
                    <@${claimer}>
                  `;
    claimersOutput = dedent(claimersOutput);
  });

  const embed = new Discord.EmbedBuilder()
    .setAuthor(AuthorConfig)
    .addFields([
      fieldInfo,
      {
        name: `Restantes: ${
          withdrawLink.max_withdrawable * (withdrawLink.uses - newUsed)
        }/${withdrawLink.max_withdrawable * withdrawLink.uses} sats`,
        value: `${":white_check_mark:".repeat(newUsed)}${
          withdrawLink.uses - newUsed > 0
            ? ":x:".repeat(withdrawLink.uses - newUsed)
            : ""
        } \n\n`,
      },
      {
        name: "Reclamado por:",
        value: claimersOutput,
      },
    ])
    .setFooter({
      text: `Identificador: ${faucet_id}`,
    });

  const disabledFaucet = withdrawLink.uses <= newUsed;
  const row = new Discord.ActionRowBuilder().addComponents([
    new Discord.ButtonBuilder()
      .setCustomId("claim")
      .setLabel(
        disabledFaucet ? "Todos los sats han sido reclamados" : `Reclamar`
      )
      .setEmoji({ name: `💸` })
      .setStyle(2)
      .setDisabled(disabledFaucet),
  ]);

  await message.edit({
    embeds: [embed],
    components: [row],
  });

  clearTimeout(faucetDebouncedUpdate[faucet_id]);
}

/*
This command will claim a LNurl
*/
module.exports = {
  customId: "claim",
  /**
   *
   * @param {ExtendedClient} client
   * @param {ButtonInteraction} Interaction
   */
  run: async (client, Interaction) => {
    await Interaction.deferReply({ ephemeral: true });

    if (usersClaiming[Interaction.user.id])
      return EphemeralMessageResponse(
        Interaction,
        "Espera a que el bot termine de procesar tu reclamo antes de iniciar otro nuevamente"
      );

    const footerContent = Interaction.message.embeds[0]?.footer?.text;
    const faucetSubStr = footerContent ? footerContent.indexOf(" ") : -1;

    const faucetId =
      faucetSubStr !== -1
        ? footerContent.substring(faucetSubStr + 1, footerContent.length)
        : false;

    if (faucetId) {
      const faucet = await getFaucet(faucetId);

      if (!faucet)
        return EphemeralMessageResponse(
          Interaction,
          "El faucet que intentas reclamar no se encuentra en la base de datos"
        );

      if (faucet.claimers_ids.includes(Interaction.user.id))
        return EphemeralMessageResponse(
          Interaction,
          "Solo puedes reclamar el premio una vez"
        );

      if (faucet.closed)
        return EphemeralMessageResponse(
          Interaction,
          "El faucet que intentas reclamar fue cerrado por su autor"
        );

      if (faucet.discord_id === Interaction.user.id)
        return EphemeralMessageResponse(
          Interaction,
          "No puedes reclamar tu propio faucet"
        );

      const { whitelist, blacklist } = await getFormattedRoleLists(
        Interaction.guild.id
      );

      if (whitelist.length || blacklist.length) {
        const userRoles = Interaction.member.roles.cache;

        const hasRoleAllowed =
          !whitelist.length ||
          userRoles.find((rol) => whitelist.includes(rol.id));

        if (!hasRoleAllowed) {
          let resOutput = dedent(` 
          No tienes ningún rol que te habilite a reclamar faucets, los roles permitidos son: 
          `);

          whitelist.forEach((role_id) => {
            resOutput += `
               <@&${role_id}>
              `;

            resOutput = dedent(resOutput);
          });

          return EphemeralMessageResponse(Interaction, resOutput);
        }

        const hasRoleDisallowed = userRoles.find((rol) =>
          blacklist.includes(rol.id)
        );

        if (hasRoleDisallowed)
          return EphemeralMessageResponse(
            Interaction,
            `No puedes reclamar debido a que posees el rol ${hasRoleDisallowed.toString()} que se encuentra en la lista de roles que no tienen permitido reclamar un faucet.`
          );
      }

      usersClaiming[Interaction.user.id] = true;

      try {
        const userWallet = await getFormattedWallet(
          Interaction.user.username,
          Interaction.user.id
        );

        const lnurlw = new LNURLw(userWallet.adminkey);
        const withdrawLink = await lnurlw.getWithdrawLink(
          faucet.withdraw_id,
          faucet.discord_id
        );

        if (withdrawLink && withdrawLink.uses <= faucet.claimers_ids.length)
          return EphemeralMessageResponse(
            Interaction,
            "El faucet ya fue reclamado en su totalidad."
          );

        const lnurl = new LNURL(userWallet.adminkey);
        const lnurlParts = await lnurl.scanLNURL(withdrawLink.lnurl);
        const redeemInvoice = await lnurl.doCallback(lnurlParts);

        if (redeemInvoice) {
          if (lnurlParts) {
            const sats = lnurlParts.maxWithdrawable / 1000;
            const content = Interaction.message.embeds[0].fields[0].value;

            const subStr = content.indexOf(">");

            let senderUserId =
              subStr !== -1 ? content.substring(2, subStr) : "";

            if (senderUserId && sats)
              await updateUserRank(senderUserId, "comunidad", sats);
          }

          const fieldInfo = Interaction.message.embeds[0].fields[0];
          await updateFaucet(faucetId, Interaction.user.id);

          if (faucetDebouncedUpdate[faucetId])
            clearTimeout(faucetDebouncedUpdate[faucetId]);

          faucetDebouncedUpdate[faucetId] = setTimeout(
            () =>
              update(faucet._id, fieldInfo, withdrawLink, Interaction.message),
            500
          );

          const new_user_details = await userWallet.sdk.getWalletDetails();

          EphemeralMessageResponse(
            Interaction,
            `Recibiste ${
              withdrawLink.max_withdrawable
            } sats por reclamar este faucet, tu nuevo balance es: ${(
              new_user_details.balance / 1000
            ).toFixed(0)} satoshis`
          );
        }
      } catch (err) {
        EphemeralMessageResponse(
          Interaction,
          "Ocurrió un error al reclamar la factura. \nEl faucet fue reclamado en su totalidad o el usuario que está regalando los fondos se ha quedado sin saldo suficiente para entregarte el premio."
        );
      }
    }

    usersClaiming[Interaction.user.id] = false;
  },
};
