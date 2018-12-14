var nameCollector = module.exports = {
	collection: mdbClient.db('heroku_jrtfvpd9').collection('ppl'),
	buffer: [],
	operationPending: false,
	collect: async function (participant) {
		if (config.testmode) return;
		
		if (this.operationPending) { this.buffer.push(participant); return }
		this.operationPending = true;
		
		if (participant.name == "Anonymous" || participant.name == "Anonymoose") return;
		
		var newMsg = function(continued){
			var str = `__**${participant._id}**__${continued ? ' (continued)' : ''}\n${participant.name}`;
			return dClient.channels.get(config.channels.name_collection).send(str);
		}

		var document = await this.collection.findOne({_id: participant._id});
		
		if (document) {
			// update person
			if (document.names.includes(participant.name)) return;
			document.names.push(participant.name);
			await this.collection.updateOne({_id: participant._id}, {$set:{names: document.names}});

			let message = await dClient.channels.get(config.channels.name_collection).messages.fetch(document.discord_msg_id);
			try {
				await message.edit(message.content + ', ' + participant.name);
			} catch(e) {
				let message = await newMsg(true);
				await this.collection.updateOne({_id: participant._id}, {$set:{discord_msg_id: message.id}});
			}
		} else {
			// add new person
			let message = await newMsg();
			await nameCollector.collection.insertOne({
				_id: participant._id,
				discord_msg_id: message.id,
				names: [participant.name]
			});
		}
		if (this.buffer.length) this.collect(this.buffer.shift());
		else this.operationPending = false;
	}
}