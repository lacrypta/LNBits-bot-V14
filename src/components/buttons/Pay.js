const Discord = require(`discord.js`);
const UserManager = require(`../../class/UserManager.js`);
const UserWallet = require("../../class/User.js");

/*
This command will pay a LNurl
*/

// const ExtendedClient = require("../../class/ExtendedClient");

module.exports = {
  customId: "pay",

  run: async (client, Interaction) => {
    console.log(`button click by ${Interaction.user.id}`);

    try {
      const payUrl = Interaction.message.embeds[0].fields.find(
        (field) => field.name === "Solicitud de pago"
      );

      const amountOnSats = Interaction.message.embeds[0].fields.find(
        (field) => field.name === "monto (sats)"
      );

      if (payUrl) {
        const u = new UserManager();
        const user = await u.getOrCreateWallet(
          Interaction.user.username,
          Interaction.user.id
        );

        const uw = new UserWallet(user.adminkey);

        const userWalletDetails = await uw.getWalletDetails();
        const satsBalance = userWalletDetails.balance / 1000;

        if (satsBalance < amountOnSats.value) {
          Interaction.reply({
            content: `No tienes balance suficiente para pagar esta factura. \nTu balance: ${satsBalance} - Requerido: ${amountOnSats.value}`,
            ephemeral: true,
          });
        } else {
          const payment = await uw.payInvoice(payUrl.value);

          if (payment) {
            const row = new Discord.ActionRowBuilder().addComponents([
              new Discord.ButtonBuilder()
                .setCustomId("pay")
                .setLabel(`Pagada por @${Interaction.user.username}`)
                .setEmoji({ name: `💸` })
                .setStyle(2)
                .setDisabled(true),
            ]);

            Interaction.update({ components: [row] });
          }
        }
      }
    } catch (err) {
      console.log(err);
    }
  },
};
