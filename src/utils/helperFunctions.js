const validateAmountAndBalance = (Interaction, amount, balance) => {
  const formatUserBalance = balance / 1000;

  if (amount <= 0) {
    Interaction.reply({
      content: `No puedes usar números negativos o flotantes`,
      ephemeral: true,
    });
    return false;
  }

  if (amount > formatUserBalance) {
    Interaction.reply({
      content: `No tienes saldo suficiente para realizar esta acción. \nRequerido: ${amount} - balance en tu billetera: ${formatUserBalance}`,
      ephemeral: true,
    });
    return false;
  }

  if (formatUserBalance - amount <= 1) {
    Interaction.reply({
      content: `Tu balance no puede quedar en 0. \n Debes dejar al menos 2 satoshis como respaldo para cubrir la comisión de lightning.`,
      ephemeral: true,
    });
    return false;
  }

  return true;
};

module.exports = {
  validateAmountAndBalance,
};
