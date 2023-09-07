const ListsModel = require("../schemas/ListSchema.js");

async function getRoleList(guild_id) {
  try {
    const roleList = await ListsModel.find({ guild_id });
    return roleList;
  } catch (err) {
    return false;
  }
}

async function getFormattedRoleLists(guild_id) {
  try {
    const faucetList = await getRoleList(guild_id);
    if (!faucetList.length)
      return {
        whitelist: [],
        blacklist: [],
      };

    const faucetWhitelist = [],
      faucetBlacklist = [];

    faucetList.forEach((list) => {
      list.type === "whitelist"
        ? faucetWhitelist.push(list.role_id)
        : faucetBlacklist.push(list.role_id);
    });

    return {
      whitelist: faucetWhitelist,
      blacklist: faucetBlacklist,
    };
  } catch (err) {
    return {
      whitelist: [],
      blacklist: [],
    };
  }
}

async function getRoleInfo(filter) {
  try {
    const roleInfo = await ListsModel.findOne(filter);
    return roleInfo;
  } catch (err) {
    return false;
  }
}

async function AddRoleToList(type, role_id, guild_id) {
  if ((type !== "whitelist" && type !== "blacklist") || !role_id) return false;

  const existRoleInList = await getRoleInfo({ role_id, guild_id });
  if (existRoleInList) return false;

  try {
    const added_role = new ListsModel({
      guild_id,
      role_id,
      type,
    });

    const result = added_role.save();
    return result;
  } catch (err) {
    console.log(err);
    return false;
  }
}

async function RemoveRoleFromList(type, role_id, guild_id) {
  if ((type !== "whitelist" && type !== "blacklist") || !role_id) return false;

  const existRoleInList = await getRoleInfo({ guild_id, role_id, type });
  if (!existRoleInList) return false;

  try {
    const role_removed = await ListsModel.findOneAndDelete({
      type,
      role_id,
      guild_id,
    });

    return role_removed;
  } catch (err) {
    return false;
  }
}

module.exports = {
  getRoleList,
  getFormattedRoleLists,
  getRoleInfo,
  AddRoleToList,
  RemoveRoleFromList,
};
