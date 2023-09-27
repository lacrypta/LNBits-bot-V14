const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const {
  validateAmountAndBalance,
  getFormattedWallet,
  FollowUpEphemeralResponse,
} = require("../../../utils/helperFunctions");
const {
  defineMultiplierPrize,
  availableChoices,
} = require("../../../utils/helperRoulette");
const dedent = require("dedent-js");
const { formatter } = require("../../../utils/helperFormatter");
const { AuthorConfig } = require("../../../utils/helperConfig");

const rouletteInfo = {
  allBets: [],
  distributePrizesInterval: false,
};

const distributePrizes = (winNumber) => {
  const prizesToDistribute = [];

  rouletteInfo.allBets.forEach((userBet) => {
    let prizeMultiplier = 0;

    const newMultiplier = defineMultiplierPrize(userBet.choice, winNumber);
    if (newMultiplier) prizeMultiplier += newMultiplier;

    if (prizeMultiplier)
      prizesToDistribute.push({
        discord_id: userBet.discord_id,
        amount: userBet.amount * prizeMultiplier,
      });
  });

  return prizesToDistribute;
};

const existBetOnUser = (discord_id) =>
  Boolean(rouletteInfo.allBets.find((bet) => bet.discord_id === discord_id));

module.exports = {
  structure: new SlashCommandBuilder()
    .setName("apostar")
    .setDescription(
      "Apuesta sats en la ruleta. Escribe /ruleta-info para obtener información sobre las posibles apuestas"
    )
    .addNumberOption((opt) =>
      opt
        .setName("sats")
        .setDescription("La cantidad de satoshis a apostar")
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("eleccion")
        .setDescription("Opción de la ruleta a la que deseas apostarle")
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
      const amount = Interaction.options.get(`sats`);
      const choice = Interaction.options.get(`eleccion`);
      const formattedChoice = choice.value;

      if (!availableChoices.includes(formattedChoice))
        return FollowUpEphemeralResponse(
          Interaction,
          "La opción elegida es incorrecta. Escribe /ruleta-info para obtener información sobre las apuestas disponibles"
        );

      const sats = Number(amount?.value);

      if (existBetOnUser(Interaction.user.id))
        return FollowUpEphemeralResponse(
          Interaction,
          "Solo puedes hacer una apuesta al mismo tiempo"
        );

      if (sats <= 0)
        return FollowUpEphemeralResponse(
          Interaction,
          "No se permiten saldos negativos"
        );

      if (sats > 100)
        return FollowUpEphemeralResponse(
          Interaction,
          "El número máximo de sats que puedes apostar es 100"
        );

      const betterWallet = await getFormattedWallet(
        Interaction.user.username,
        Interaction.user.id
      );

      if (!betterWallet.id)
        return FollowUpEphemeralResponse(
          Interaction,
          "Ocurrió un error al obtener la información del usuario"
        );

      const isValidAmount = validateAmountAndBalance(
        Number(sats),
        betterWallet.balance
      );

      if (!isValidAmount.status)
        return FollowUpEphemeralResponse(Interaction, isValidAmount.content);

      // new userWallet(rouletteWallet)
      // createInvoice(sats, "apuesta ruleta")
      // payInvoice
      // addBet + message response
      // if !interval setTimeout(distributePrizes, 30000)

      rouletteInfo.allBets.push({
        discord_id: Interaction.user.id,
        choice: choice.value,
        amount: sats,
      });

      console.log(Boolean(rouletteInfo.distributePrizesInterval));
      console.log(rouletteInfo);

      if (!rouletteInfo.distributePrizesInterval)
        setTimeout(() => {
          const winNumber = 1;
          const winners = distributePrizes(winNumber);

          const channel = client.channels.cache.find(
            (channel) => channel.id === Interaction.channel.id
          );

          let winnersOutput = ``;
          if (winners && winners.length) {
            winners.forEach((winner) => {
              winnersOutput += `
          <@${winner.discord_id}>  •  \`${formatter(0, 0).format(
                winner.amount
              )} sats\`
            `;

              winnersOutput = dedent(winnersOutput);
            });

            const embed = new EmbedBuilder()
              .setColor(`#0099ff`)
              .setAuthor(AuthorConfig)
              .addFields(
                { name: "Numero ganador en la ruleta ", value: `${winNumber}` },
                { name: "Ganadores", value: winnersOutput }
              );

            channel.send({ embeds: [embed] });
          } else {
            channel.send("Ruleta: No hubo ganadores");
          }

          rouletteInfo.allBets = [];
          rouletteInfo.distributePrizesInterval = false;
        }, 15000);

      Interaction.editReply({
        content: `${Interaction.user.toString()} apostó ${sats} sats en la ruleta a la opción ${formattedChoice}`,
      });

      // distributePrizes = defineMultiplier + sendSats
      // distributerPizes();

      //   const invoiceDetails = await receiverWallet.sdk.createInvote(
      //     sats,
      //     message.value
      //   );

      //   const invoicePaymentDetails = await senderWallet.sdk.payInvoice(
      //     invoiceDetails.payment_request
      //   );

      //   if (invoicePaymentDetails) {
      //     await updateUserRank(Interaction.user.id, "comunidad", sats);

      //     await Interaction.editReply({
      //       content: `${Interaction.user.toString()} envió ${sats} satoshis a ${receiverData.toString()}`,
      //     });
      //   }
    } catch (err) {
      console.log(err);
      return FollowUpEphemeralResponse(Interaction, "Ocurrió un error");
    }
  },
};
