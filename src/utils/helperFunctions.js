const validateAmountAndBalance = (amount, balance) => {
  const formatUserBalance = balance / 1000;

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

module.exports = {
  validateAmountAndBalance,
};
