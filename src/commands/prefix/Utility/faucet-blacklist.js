const {
  AddRoleToList,
  RemoveRoleFromList,
} = require("../../../handlers/lists");

const parametersResponse = {
  content:
    "Parámetros incorrectos. El formato es: **!blacklist <add o remove> <@rol>**",
  ephemeral: true,
};

module.exports = {
  structure: {
    name: "faucet-blacklist",
    description:
      "Agrega o remueve roles que NO tendrán permitido reclamar faucets.",
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
    if (args.length !== 2) return message.reply(parametersResponse);

    const option = args[0];
    const roleId = args[1] ? args[1].slice(3, -1) : 0;

    if (!option || !roleId || (option !== "add" && option !== "remove"))
      return message.reply(parametersResponse);

    const guildRoles = await message.guild.roles.fetch();
    const existRoleInGuild = guildRoles.find((rol) => rol.id === roleId);

    if (!existRoleInGuild)
      return message.reply({
        content: "El rol enviado en el parámetro no existe",
        ephemeral: true,
      });

    if (option === "add") {
      const roleAdded = await AddRoleToList("blacklist", roleId);

      if (!roleAdded)
        return message.reply({
          content: "El rol que quieres agregar ya existe en el listado",
          ephemeral: true,
        });

      if (roleAdded)
        return message.reply({
          content: `El rol ${existRoleInGuild.toString()} fue agregado a la blacklist`,
          ephemeral: true,
        });
    } else if (option === "remove") {
      const roleRemoved = await RemoveRoleFromList("blacklist", roleId);

      if (!roleRemoved)
        return message.reply({
          content: "El rol que quieres eliminar no existe en la blacklist",
          ephemeral: true,
        });

      return message.reply({
        content: `El rol ${existRoleInGuild.toString()} fue eliminado de la blacklist`,
        ephemeral: true,
      });
    }
  },
};
