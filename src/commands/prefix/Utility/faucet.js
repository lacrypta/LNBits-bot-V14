const {
  AddRoleToList,
  RemoveRoleFromList,
} = require("../../../handlers/lists");

const parametersResponse =
  "**[error en !faucet]** Parámetros incorrectos. El formato es: **!faucet <whitelist o blacklist> <add o remove> <@rol>**";

module.exports = {
  structure: {
    name: "faucet",
    description:
      "Agrega o remueve roles que tienen permitido reclamar faucets.",
    aliases: [],
    permissions: "Administrator",
    cooldown: 5000,
  },
  /**
   * @param {ExtendedClient} client
   * @param {Message} message
   * @param {[String]} args
   */
  run: async (client, message, args) => {
    if (args.length !== 3) return message.member.send(parametersResponse);

    const type = args[0];
    const option = args[1];
    const roleId = args[2] ? args[2].slice(3, -1) : 0;

    if (
      !option ||
      !roleId ||
      (option !== "add" && option !== "remove") ||
      (type !== "whitelist" && type !== "blacklist")
    )
      return message.member.send(parametersResponse);

    const guildRoles = await message.guild.roles.fetch();
    const existRoleInGuild = guildRoles.find((rol) => rol.id === roleId);

    if (!existRoleInGuild)
      return message.member.send(
        `**[error en !faucet]** El rol que enviaste en el parámetro no existe en el servidor **${message.guild.name}**`
      );

    if (option === "add") {
      const roleAdded = await AddRoleToList(type, roleId, message.guild.id);

      if (!roleAdded)
        return message.member.send(
          `**[error en !faucet]** El rol que quieres agregar ya existe en el listado`
        );

      if (roleAdded)
        return message.member.send(
          `**[uso de !faucet en ${message.guild.name}]** El rol **${existRoleInGuild.name}** fue agregado a la ${type}`
        );
    } else if (option === "remove") {
      const roleRemoved = await RemoveRoleFromList(
        type,
        roleId,
        message.guild.id
      );

      if (!roleRemoved)
        return message.member.send(
          `**[error en !faucet]** El rol que quieres eliminar no existe en la ${type}`
        );

      return message.member.send(
        `**[uso de !faucet en ${message.guild.name}]** El rol **${existRoleInGuild.name}** fue eliminado de la ${type}`
      );
    }
  },
};
