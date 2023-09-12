const UserWallet = require("../class/User");
const UserManager = require("../class/UserManager");

const getFormattedWallet = async (username, discord_id) => {
  const um = new UserManager();
  const walletKeys = await um.getOrCreateWallet(username, discord_id);

  const sdk = new UserWallet(walletKeys.adminkey);
  const walletDetails = await sdk.getWalletDetails();

  return {
    ...walletKeys,
    balance: walletDetails.balance / 1000,
    sdk,
  };
};

const validateAmountAndBalance = (amount, balance) => {
  const formatUserBalance = balance;

  if (amount <= 0)
    return {
      status: false,
      content: "No puedes usar números negativos o flotantes",
    };

  if (amount > formatUserBalance)
    return {
      status: false,
      content: `No tienes saldo suficiente para realizar esta acción. \nRequerido: ${amount} - balance en tu billetera: ${formatUserBalance}`,
    };

  if (formatUserBalance - amount <= 1)
    return {
      status: false,
      content: `Tu balance no puede quedar en 0. \n Debes dejar al menos 2 satoshis como respaldo para cubrir la comisión de lightning.`,
    };

  return {
    status: true,
    content: "",
  };
};

const handleBotResponse = async (Interaction, objConfig) => {
  Interaction.deferred
    ? await Interaction.editReply(objConfig)
    : await Interaction.reply(objConfig);
};

const EphemeralMessageResponse = async (Interaction, content) => {
  const objectResponse = {
    content,
    ephemeral: true,
  };

  await handleBotResponse(Interaction, objectResponse);
};

const FollowUpEphemeralResponse = async (Interaction, content) => {
  await Interaction.deleteReply();
  await Interaction.followUp({
    content: content,
    ephemeral: true
  });
};

module.exports = {
  getFormattedWallet,
  validateAmountAndBalance,
  handleBotResponse,
  EphemeralMessageResponse,
  FollowUpEphemeralResponse,
};
