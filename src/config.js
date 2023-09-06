module.exports = {
  client: {
    token: process.env.CLIENT_TOKEN,
    id: process.env.CLIENT_ID,
  },
  handler: {
    prefix: "!",
    deploy: true,
    commands: {
      prefix: true,
      slash: true,
      user: true,
      message: true,
    },
    mongodb: {
      uri: process.env.MONGODB_URI,
      toggle: true,
    },
  },
};
