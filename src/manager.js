const { Manager } = require("erela.js");

module.exports = function (client) {
  return new Manager({
    nodes: [
      {
        host: "localhost",
        port: 9000,
        password: "password111",
      },
    ],
    send(id, payload) {
      const guild = client.guilds.cache.get(id);
      if (guild) guild.shard.send(payload);
    },
  })
    .on("nodeConnect", (node) =>
      console.log(`Node ${node.options.identifier} connected`)
    )
    .on("nodeError", (node, error) =>
      console.log(
        `Node ${node.options.identifier} had an error: ${error.message}`
      )
    )
    .on("trackStart", (player, track) => {
      client.channels.cache
        .get(player.textChannel)
        .send(`Now playing: ${track.title}`);
    })
    .on("queueEnd", (player) => {
      client.channels.cache.get(player.textChannel).send("Queue has ended.");
      player.destroy();
    });
};
