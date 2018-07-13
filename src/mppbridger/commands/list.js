module.exports = {
	description: "Lists online participants",
	aliases: ['ppl', 'online'],
	exec: async function (message) {
		var row = (await dbClient.query("SELECT mpp_room, site FROM bridges WHERE discord_channel_id = $1;", [message.channel.id])).rows[0];
		if (!row) {
			//message.react('🚫');
			message.reply(`Use this in a bridged room to see who is at the other side.`);
			return;
		}
		var ppl = clients[row.site][row.mpp_room].ppl;
		
		var numberOfPpl = Object.keys(ppl).length;
		var str = `__**Participants Online (${numberOfPpl})**__\n`;
		var names = [];
		for (let person in ppl) {
			person = ppl[person];
			names.push(`\`${person._id.substr(0,6)}\` ${person.name.replace(/<@/g, "<\\@")}`);
		}
		str += names.join(', ');
		message.channel.send(str, {split:{char:''}});
	}
};