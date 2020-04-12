module.exports = {
	usage: "<MPP room>",
	description: "Creates a bridge to the specified MPP room.",
	exec: async function (msg) {
		if (msg.author.id != config.opID) {
			msg.reply(`Bridging has been disabled; ask <@${config.opID}> if you actually want to bridge this room.`);
			return;	
		}
		var site = 'MPP';
		var room = msg.txt(1);
		if (!room) return "EBADUSG";
		var existingBridge = (await dbClient.query("SELECT * FROM bridges WHERE mpp_room = $1 AND site = 'MPP';", [room])).rows[0];
		if (existingBridge) {
			if (!existingBridge.disabled) {
				return msg.reply(`${site} room ${room} is already bridged.`);
			} else {
				if (config.disabledRooms.includes(room)) {
					return msg.reply(`You cannot bridge this room.`);
				} else /* rebridge */ {
					let channel = dClient.guilds.resolve(config.guildID).channels.resolve(existingBridge.discord_channel_id);
					await dbClient.query("UPDATE bridges SET disabled = false WHERE mpp_room = $1 AND site = 'MPP'", [room]);
					await channel.setParent(config.channels.mpp_bridges);
					await new Promise(resolve => setTimeout(resolve, 500));
					await channel.lockPermissions();
					let existingClient = clients.MPP[room];
					if (existingClient) existingClient.start();
					else createMPPbridge(room, existingBridge.discord_channel_id, existingBridge.site, existingBridge.webhook_id, existingBridge.webhook_token);
					await msg.reply(`${site} room ${room} has been re-bridged to ${channel}.`);
					return;
				}
			}
		}
		/* new bridge */
		var discordChannelName = room;
		var categoryID = config.channels.mpp_bridges;
		var channel = await dClient.guilds.resolve(config.guildID).channels.create(discordChannelName, {parent: categoryID});
		channel.setTopic(`http://www.multiplayerpiano.com/${encodeURIComponent(room)}`);
		var webhook = await channel.createWebhook('Webhook');
		createMPPbridge(room, channel.id, site, webhook.id, webhook.token);
		dbClient.query('INSERT INTO bridges (site, mpp_room, discord_channel_id, webhook_id, webhook_token, owner_discord_user_id) VALUES ($1, $2, $3, $4, $5, $6)', [
			site, room, channel.id, webhook.id, webhook.token, msg.author.id, 
		]);
		msg.reply(`${site} room ${room} is now bridged to ${channel}.`);
	}
};
