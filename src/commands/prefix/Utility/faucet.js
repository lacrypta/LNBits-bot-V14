const {
  AddRoleToList,
  RemoveRoleFromList,
} = require("../../../handlers/lists");

const parametersResponse = {
  content:
    "Parámetros incorrectos. El formato es: **!faucet <whitelist o blacklist> <add o remove> <@rol>**",
  ephemeral: true,
};

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
    if (args.length !== 3) return message.reply(parametersResponse);

    const type = args[0];
    const option = args[1];
    const roleId = args[2] ? args[2].slice(3, -1) : 0;

    if (
      !option ||
      !roleId ||
      (option !== "add" && option !== "remove") ||
      (type !== "whitelist" && type !== "blacklist")
    )
      return message.reply(parametersResponse);

    const guildRoles = await message.guild.roles.fetch();
    const existRoleInGuild = guildRoles.find((rol) => rol.id === roleId);

    if (!existRoleInGuild)
      return message.reply({
        content: "El rol enviado en el parámetro no existe",
        ephemeral: true,
      });

    if (option === "add") {
      const roleAdded = await AddRoleToList(type, roleId, message.guild.id);

      if (!roleAdded)
        return message.reply({
          content: "El rol que quieres agregar ya existe en el listado",
          ephemeral: true,
        });

      if (roleAdded)
        return message.reply({
          content: `El rol ${existRoleInGuild.toString()} fue agregado a la ${type}`,
          ephemeral: true,
        });
    } else if (option === "remove") {
      const roleRemoved = await RemoveRoleFromList(
        type,
        roleId,
        message.guild.id
      );

      if (!roleRemoved)
        return message.reply({
          content: `El rol que quieres eliminar no existe en la ${type}`,
          ephemeral: true,
        });

      return message.reply({
        content: `El rol ${existRoleInGuild.toString()} fue eliminado de la ${type}`,
        ephemeral: true,
      });
    }
  },
};
