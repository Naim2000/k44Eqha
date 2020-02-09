const PRClient = require("./PRClient.js");

let client = new PRClient({// account stuff
	username: "Discord",
	password: config.pr_password,
	roomName: 'lobby'
});
global.prClient = client;
client.connect();
client.socket.on("setRoom", function (data, callback) {
	client.roomID = data.roomID;
	try {
		if (client.channels.chatChannel && client.roomID) {
			client.socket.destroyChannel(client.roomID);
		}
	} catch (err) {}
	client.channels.chatChannel = client.socket.subscribe(data.roomID);
	client.channels.chatChannel.watch(messagehandle);
})

async function messagehandle(data) {
    if (data && data.type) {
        switch (data.type) {
            case "chat":
                if (data && data.message) {
                    let name = data.name || "";
                    let effect = data.effect || "";
                    let roomName = data.roomName;
                    let color = data.color;
                    let id = data.sID || data.socketID || data.id;
					if (id == client.socket.id) return;
					let c = dClient.channels.get("593943518351982603");
					let msg;
				    (!name && (data.message.startsWith("[i]"))) ? msg = `*${escapeDiscordMentions(data.message.split("[i]")[1])}*` : msg = `**${sanitizeName(name)}:** ${escapeDiscordMentions(data.message)}`;
                    if (c) c.send(msg);
                }
                break;
        }
    }
}

dClient.on("local_message", async message => {
	if (message.channel.id != "593943518351982603" || message.author.id == dClient.user.id) return;
	if (!client.roomID) return;
	client.socket.publish(client.roomID, {
		"type": "chat",
		"message": `${message.member && message.member.displayName || message.author.username}#${message.author.discriminator}: ${message.cleanContent + (message.attachments.size > 0 && message.attachments.map(x => x.url).join(' ') || '')}`,
		"value": false,
		"socketID": "[discord.gg/k44Eqha]",
		"uuid": "[discord.gg/k44Eqha]",
		"color": "#8012ed",
		"name": "[discord.gg/k44Eqha]"
    });
});
