const ListsModel = require("../schemas/ListSchema.js");

async function getRoleList() {
  try {
    const roleList = await ListsModel.find();
    return roleList;
  } catch (err) {
    return false;
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

async function AddRoleToList(type, role_id) {
  if ((type !== "whitelist" && type !== "blacklist") || !role_id) return false;

  const existRoleInList = await getRoleInfo({ role_id });
  if (existRoleInList) return false;

  try {
    const added_role = new ListsModel({
      type,
      role_id,
    });

    const result = added_role.save();
    return result;
  } catch (err) {
    console.log(err);
    return false;
  }
}

async function RemoveRoleFromList(type, role_id) {
  if ((type !== "whitelist" && type !== "blacklist") || !role_id) return false;
  const existRoleInList = await getRoleInfo({ type, role_id });
  if (!existRoleInList) return false;

  try {
    const role_removed = await ListsModel.findOneAndDelete({
      type,
      role_id,
    });

    return role_removed;
  } catch (err) {
    return false;
  }
}

module.exports = {
  getRoleList,
  getRoleInfo,
  AddRoleToList,
  RemoveRoleFromList,
};
