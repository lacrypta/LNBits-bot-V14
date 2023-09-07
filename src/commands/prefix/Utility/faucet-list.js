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

    let cmdOutput = ``;

    rolesList.forEach((rolInfo) => {
      cmdOutput += `
         <@&${rolInfo.role_id}> - **${rolInfo.type}**
        `;

      cmdOutput = dedent(cmdOutput);
    });

    if (cmdOutput.length)
      return message.reply({
        content: cmdOutput,
      });

    return message.reply({
      content: "No hay roles añadidos a ninguna lista",
    });
  },
};
