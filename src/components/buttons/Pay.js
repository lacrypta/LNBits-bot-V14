const Discord = require(`discord.js`);
const {
  getFormattedWallet,
  EphemeralMessageResponse,
} = require("../../utils/helperFunctions");

/*
This command will pay a LNurl
*/

// const ExtendedClient = require("../../class/ExtendedClient");

module.exports = {
  customId: "pay",

  run: async (client, Interaction) => {
    try {
      const payUrl = Interaction.message.embeds[0].fields.find(
        (field) => field.name === "Solicitud de pago"
      );

      const amountOnSats = Interaction.message.embeds[0].fields.find(
        (field) => field.name === "monto (sats)"
      );

      if (payUrl) {
        const userWallet = await getFormattedWallet(
          Interaction.user.username,
          Interaction.user.id
        );

        const satsBalance = userWallet.balance / 1000;

        if (satsBalance < amountOnSats.value) {
          return EphemeralMessageResponse(
            Interaction,
            `No tienes balance suficiente para pagar esta factura. \nTu balance: ${satsBalance} - Requerido: ${amountOnSats.value}`
          );
        } else {
          const payment = await userWallet.sdk.payInvoice(payUrl.value);

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
      return EphemeralMessageResponse(Interaction, "Ocurrió un error");
    }
  },
};
