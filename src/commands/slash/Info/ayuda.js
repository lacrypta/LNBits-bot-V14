const {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
} = require("discord.js");
const ExtendedClient = require("../../../class/ExtendedClient");
const config = require("../../../config");
const GuildSchema = require("../../../schemas/GuildSchema");
const dedent = require("dedent-js");
const { AuthorConfig } = require("../../../utils/helperConfig");

module.exports = {
  structure: new SlashCommandBuilder()
    .setName("ayuda")
    .setDescription("Obtener ayuda sobre los comandos."),
  /**
   * @param {ExtendedClient} client
   * @param {ChatInputCommandInteraction} interaction
   * @param {[]} args
   */
  run: async (client, Interaction, args) => {
    let cmdOutput = ``;
    client.applicationcommandsArray.forEach(async (cmd) => {
      if (cmd.name != `ayuda`) {
        let params = ``;
        cmd.options.forEach(async (opt) => {
          params += `${opt.name}: <${opt.type}> `;
        });
        cmdOutput += `
          - ${cmd.name}: ${cmd.description} \`/${cmd.name} ${params}\`
        `;
      }
      cmdOutput = dedent(cmdOutput);
    });

    const embed = new EmbedBuilder()
      .setColor(`#0099ff`)
      .setAuthor(AuthorConfig)
      .setURL(`https://wallet.lacrypta.ar`)
      .setDescription(
        dedent(`
    Este bot le permite interactuar con otros usuarios utilizando el poder de la red lightning. Ya tienes una billetera asociada a tu usuario, puedes utilizarla con los comandos que se definen a continuación:
    `)
      )
      .addFields(
        { name: `\u200B`, value: `\u200B` },
        {
          name: `INFORMACIÓN IMPORTANTE`,
          value: `¡Este es un servicio de custodia, no controlas tu dinero hasta que lo retiras!`,
        },
        { name: `\u200B`, value: `\u200B` },
        { name: `Comandos`, value: cmdOutput }
      );

    Interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
