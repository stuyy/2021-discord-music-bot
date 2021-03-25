require("dotenv").config();
const { Client, MessageEmbed } = require("discord.js");

const client = new Client();

client.manager = require("./manager")(client);

client.login(process.env.DISCORD_BOT_TOKEN);

client.on("ready", () => {
  console.log("Discord Bot has logged in.");
  client.manager.init(client.user.id);
});

client.on("raw", (d) => client.manager.updateVoiceState(d));

client.on("message", async (message) => {
  if (message.content.startsWith("!play")) {
    const res = await client.manager.search(
      message.content.slice(6),
      message.author
    );
    // Create a new player. This will return the player if it already exists.
    const player = client.manager.create({
      guild: message.guild.id,
      voiceChannel: message.member.voice.channel.id,
      textChannel: message.channel.id,
    });
    // Connect to the voice channel.
    player.connect();

    // Adds the first track to the queue.
    player.queue.add(res.tracks[0]);
    message.channel.send(`Enqueuing track ${res.tracks[0].title}.`);

    // Plays the player (plays the first track in the queue).
    // The if statement is needed else it will play the current track again
    if (!player.playing && !player.paused && !player.queue.size) player.play();
  } else if (message.content === "!skip") {
    const player = client.manager.players.get(message.guild.id);
    console.log(player);
    player.stop();
  } else if (message.content === "!pause") {
    const player = client.manager.players.get(message.guild.id);
    if (player.paused) {
      player.pause(false); // this will unpause the player
      message.channel.send("Player is no longer paused.");
    } else {
      player.pause(true); // this will pause the player
      message.channel.send("Player is now paused.");
    }
  } else if (message.content === "!loop") {
    const player = client.manager.players.get(message.guild.id);
    if (player.queueRepeat) {
      player.setQueueRepeat(false);
      message.channel.send("Player is no longer on repeat.");
    } else {
      player.setQueueRepeat(true);
      message.channel.send("Player is now on repeat.");
    }
  } else if (message.content.startsWith("!search")) {
    const index = message.content.indexOf(" ");
    const query = message.content.slice(index + 1);
    const results = await client.manager.search(query, message.author);
    const tracks = results.tracks.slice(0, 10);
    let resultsDescription = "";
    let counter = 1;
    for (const track of tracks) {
      resultsDescription += `${counter}) [${track.title}](${track.uri})\n`;
      counter++;
    }
    const embed = new MessageEmbed().setDescription(resultsDescription);
    message.channel.send(
      "What song would you like to choose? Enter the number.",
      embed
    );
    const response = await message.channel.awaitMessages(
      (msg) => msg.author.id === message.author.id,
      {
        max: 1,
        time: 30000,
      }
    );
    const answer = response.first().content;
    const track = tracks[answer - 1];
    console.log(track);
    const player = client.manager.players.get(message.guild.id);
    if (player) {
      player.queue.add(track);
      message.channel.send(`${track.title} was added to the queue.`);
    } else {
      message.channel.send(
        "The bot is not in a voice channel or does not have a player existing."
      );
    }
  }
});
