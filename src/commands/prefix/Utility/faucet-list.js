const dedent = require("dedent-js");
const { getRoleList } = require("../../../handlers/lists");

module.exports = {
  structure: {
    name: "faucet-list",
    description:
      "Listado de roles permitidos e inhabilitados para reclamar faucet",
    aliases: [],
    permissions: "Administrator",
    cooldown: 5000,
  },
  /**
   * @param {ExtendedClient} client
   * @param {Message} message
   * @param {[String]} args
   */
  run: async (client, message) => {
    const rolesList = await getRoleList(message.guild.id);
    const serverRoles = await message.guild.roles.fetch();

    let cmdOutput = dedent(
      `**[FAUCET]** \n Blacklist y Whitelist de roles en el servidor ${message.guild.name}`
    );

    rolesList.forEach((rolInfo) => {
      const roleDetails = serverRoles.find((rol) => rol.id === rolInfo.role_id);

      if (roleDetails) {
        cmdOutput += `
           ${"```"}${roleDetails.name} - ${rolInfo.type}${"```"}
          `;

        cmdOutput = dedent(cmdOutput);
      }
    });

    if (cmdOutput.length) return message.member.send(cmdOutput);

    return message.member.send(
      `${cmdOutput} \n No hay roles añadidos a ninguna lista`
    );
  },
};
