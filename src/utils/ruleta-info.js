const {
  SlashCommandBuilder,
  AttachmentBuilder,
  EmbedBuilder,
} = require("discord.js");

const { EphemeralMessageResponse } = require("./helperFunctions");
const { AuthorConfig } = require("./helperConfig");

module.exports = {
  structure: new SlashCommandBuilder()
    .setName("ruleta-info")
    .setDescription("Información sobre la ruleta"),
  /**
   * @param {ExtendedClient} client
   * @param {ChatInputCommandInteraction} Interaction
   * @param {[]} args
   */
  run: async (client, Interaction) => {
    await Interaction.deferReply({ ephemeral: true });

    try {
      const attachment = new AttachmentBuilder(
        "./src/utils/ruleta.png"
      ).setName("image.png");

      const embed = new EmbedBuilder()
        .setAuthor(AuthorConfig)
        .setImage(`attachment://image.png`)
        .addFields([
          {
            name: `Ruleta`,
            value: `Puedes hacer una única apuesta en un mismo juego`,
          },
          {
            name: "Multiplicadores",
            value: `[x36] número simple \n [x 3] Docena (1-12, 13-24, 25-36) \n [x 3] Columna (1st, 2nd, 3rd) \n [x 2] Mitad (1-18, 19-36) \n [x 2] Par o impar (even, odd) \n [x 2] Colores (red, black)`,
          },
          {
            name: "Ejemplos",
            value:
              "/ruleta <sats> <elección> \n /ruleta 100 par \n /ruleta 100 negro \n /ruleta 100 1st \n /ruleta 1-18 \n /ruleta 100 0",
          },
        ]);

      return Interaction.editReply({
        embeds: [embed],
        files: [attachment],
        ephemeral: true,
      });
    } catch (err) {
      console.log(err);
      return EphemeralMessageResponse(Interaction, "Ocurrió un error.");
    }
  },
};
