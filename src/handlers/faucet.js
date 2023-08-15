const FaucetModel = require("../schemas/FaucetSchema.js");

const createFaucet = async (discord_id, withdraw_id) => {
  try {
    const newFaucet = new FaucetModel({
      discord_id,
      withdraw_id,
      claimersId: [],
    });

    const result = newFaucet.save();
    return result;
  } catch (err) {
    return null;
  }
};

const getFaucet = async (faucet_id) => {
  if (!faucet_id) return null;

  try {
    const faucet = await FaucetModel.findOne({
      _id: faucet_id,
    });

    if (faucet) return faucet;
  } catch (err) {
    return null;
  }

  return null;
};

const updateFaucet = async (faucet_id, new_claimer) => {
  try {
    const faucet = await getFaucet(faucet_id);
    if (!faucet) return null;

    faucet.claimersId = faucet.claimers_ids.push(new_claimer);
    await faucet.save();

    return faucet;
  } catch (err) {
    console.log(err);
    return null;
  }
};

module.exports = {
  createFaucet,
  getFaucet,
  updateFaucet,
};
