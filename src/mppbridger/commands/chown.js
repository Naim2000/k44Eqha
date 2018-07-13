module.exports = {
	usage: "<'mpp'/'discord'> <Discord User ID or mention, or MPP _id>",
	description: "Changes the MPP or Discord owner of a private bridge. The first argument must be either `mpp` or `discord`.",
	aliases: ['changeowner', 'setowner'],
	exec: async function (msg) {
		if (msg.args.length < 3 || !['mpp','discord'].includes(msg.args[1])) return "EBADUSG";
		var res = await dbClient.query('SELECT * FROM bridges WHERE discord_channel_id = $1;', [msg.channel.id]);
		if (res.rows.length == 0) return msg.react('🚫');
		var bridge = res.rows[0];
		if (!(bridge.owner_discord_user_id == msg.author.id || msg.author.id == config.opID)) return msg.react('🚫');

		if (msg.args[1] == 'discord') {
			let selectedUser = dClient.users.get(msg.args[2]) || msg.mentions.users.first();
			if (!selectedUser) return msg.react('⚠️');
			msg.channel.overwritePermissions(selectedUser, {
				MANAGE_CHANNELS: true,
				MANAGE_ROLES: true,
				MANAGE_WEBHOOKS: true,
				MANAGE_MESSAGES: true
			});
			let po = msg.channel.permissionOverwrites.find(x => x.id == msg.author.id);
			if (po) po.delete();
			await dbClient.query('UPDATE bridges SET owner_discord_user_id = $1 WHERE discord_channel_id = $2;', [selectedUser.id, msg.channel.id]);
			msg.channel.send(`Ownership of ${msg.channel} has been transferred to ${selectedUser}`);
		} else if (msg.args[1] == 'mpp') {
			let _id = msg.args[2];
			await dbClient.query('UPDATE bridges SET owner_mpp__id = $1 WHERE discord_channel_id = $2;', [_id, msg.channel.id]);
			msg.channel.send(`MPP user \`${_id}\` has been assigned as owner of the MPP room, and the crown will be transferred to them whenever possible.`);
			//todo give crown if owner there
		}
	}
};