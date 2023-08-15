const RankingModel = require("../schemas/RankSchema.js");

const createRank = async (discord_id, type, amount) => {
  try {
    const newUserRank = new RankingModel({
      discord_id,
      type,
      amount,
    });
    const result = newUserRank.save();

    return result;
  } catch (err) {
    return null;
  }
};

const getRank = async (discord_id, type) => {
  if (!discord_id) return null;

  try {
    const user_rank = await RankingModel.findOne({
      discord_id,
      type,
    });
    if (user_rank) return user_rank;
  } catch (err) {
    return null;
  }

  return null;
};

const updateUserRank = async (discord_id, type, new_amount) => {
  try {
    const userRank = await getRank(discord_id, type);

    if (userRank) {
      userRank.amount = userRank.amount + new_amount;
      await userRank.save();

      return userRank;
    } else {
      const new_rank = await createRank(discord_id, type, new_amount);

      return new_rank;
    }
  } catch (err) {
    console.log(err);
    return null;
  }
};

const getTopRanking = async (type) => {
  try {
    const topUsers = await RankingModel.find({ type })
      .sort({ amount: -1 })
      .limit(10);

    return topUsers;
  } catch (err) {
    console.log(err);
    return null;
  }
};

const getSumOfDonationAmounts = async (type) => {
  try {
    const result = await RankingModel.aggregate([
      { $match: { type: type } },
      { $group: { _id: null, totalAmount: { $sum: "$amount" } } },
    ]);

    if (result.length > 0) return result[0].totalAmount;
    return 0;
  } catch (err) {
    console.error(err);
    return null;
  }
};

module.exports = {
  updateUserRank,
  getTopRanking,
  getSumOfDonationAmounts,
};
