const { log } = require("../../functions");

module.exports = {
  event: "ready",
  once: true,
  /**
   *
   * @param {ExtendedClient} _
   * @param {import('discord.js').Client<true>} client
   * @returns
   */
  run: (_, client) => {
    log("Logged in as: " + client.user.tag, "done");
  },
};
