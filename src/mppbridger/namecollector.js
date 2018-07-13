module.exports = {
	collection: mdbClient.db('heroku_jrtfvpd9').collection('ppl'),
	collect: async function (participant) {
		if (config.testmode) return;
		if (participant.name == "Anonymous" || participant.name == "Anonymoose") return;

		var newMsg = function(continued){
			var str = `__**${participant._id}**__${continued ? ' (continued)' : ''}\n${participant.name}`;
			return dClient.channels.get('379738469511069698').send(str);
		}

		var document = await this.collection.findOne({_id: participant._id});
		
		if (document) {
			// update person
			if (document.names.includes(participant.name)) return;
			document.names.push(participant.name);
			this.collection.updateOne({_id: participant._id}, {$set:{names: document.names}});

			let message = await dClient.channels.get('379738469511069698').messages.fetch(document.discord_msg_id);
			try {
				await message.edit(message.content + ', ' + participant.name);
			} catch(e) {
				let message = await newMsg(true);
				this.collection.updateOne({_id: participant._id}, {$set:{discord_msg_id: message.id}});
			}
		} else {
			// add new person
			let message = await newMsg();
			nameCollector.collection.insertOne({
				_id: participant._id,
				discord_msg_id: message.id,
				names: [participant.name]
			});
		}
	}
}