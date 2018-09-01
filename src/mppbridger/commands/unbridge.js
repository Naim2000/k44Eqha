module.exports = {
	usage: "[MPP Room]",
	description: "Deletes a bridge to the specified MPP room.",
	exec: async function (msg) {
		var bridge = (await dbClient.query("SELECT * FROM bridges WHERE mpp_room = $1 OR discord_channel_id = $2", [msg.txt(1), msg.channel.id])).rows[0];
		if (!bridge) {
			//msg.react('⚠️');
			msg.reply(`That room is not bridged. Make sure you type the MPP room name correctly.`);
			return;
		}
		if (bridge.disabled) {
			msg.reply(`That room has already been unbridged.`);
			return;
		}
		if (!(bridge.owner_discord_user_id == msg.author.id || msg.author.id == config.opID)) {
			//msg.react('🚫');
			msg.reply(`You do not own that bridge.`);
			return;
		}
		await dbClient.query("UPDATE bridges SET disabled = 'true' WHERE mpp_room = $1", [bridge.mpp_room]);
		var client = clients.MPP[bridge.mpp_room];
		if (client) client.stop();
		var channel = dClient.channels.get(bridge.discord_channel_id)
		await channel.setParent(config.channels.deleted_bridges);
		await new Promise(resolve => setTimeout(resolve, 500));
		await channel.lockPermissions();
		msg.reply(`${bridge.mpp_room} has been unbridged.`);
	}
};
