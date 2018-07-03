var Client = require('./lib/Client.js');
global.clients = {};








/*function reconnectClients() {
	for (let site in clients) {
		site = clients[site];
		let i = 0;
		for (let client in site) {
			client = site[client];
			if (client.reconnectTimeout) clearTimeout(client.reconnectTimeout);
			client.reconnectTimeout = setTimeout(()=>{
				client.connect();
				client.reconnectTimeout = undefined;
			}, i += 2000);
		}
	}
} //TODO BETTAH*/


global.clientConnector = {
	queue: [],
	enqueue: function(client) {
		if (this.queue.includes(client)) return;
		this.queue.push(client);
	},
	interval: setInterval(function(){
		var client = clientConnector.queue.shift();
		if (client) client.connect();
	}, 2000)
}



global.createMPPbridge = function (room, DiscordChannelID, site = 'MPP', webhookID, webhookToken) {
	var DiscordChannel = dClient.channels.get(DiscordChannelID);
	if (!DiscordChannel) return console.error(`Couldn't bridge ${site} ${room} because Discord Channel ${DiscordChannelID} is missing!`);
	if (webhookID && webhookToken) var webhook = new Discord.WebhookClient(webhookID, webhookToken, {disableEveryone:true});
	
	var msgBuffer = [];
	function _dSend(msg, embed) {
		if (webhook && !config.testmode) {
			let username = gClient.channel && gClient.channel._id || room;
			if (username.length > 32) username = username.substr(0,31) + '…';
			else if (username.length < 2) username = undefined;
			webhook.send(msg, {username, embed, split:{char:''}}).catch(e => {
				console.error(e);
				DiscordChannel.send(msg, {embed, split:{char:''}}).catch(console.error);
			});
		}
		else DiscordChannel.send(msg, {embed, split:{char:''}}).catch(console.error);
	}
	function dSend(msg) {
		msgBuffer.push(msg);
	}
	setInterval(()=>{
		if (msgBuffer.length == 0) return;
		_dSend(msgBuffer.join('\n'));
		msgBuffer = [];
	}, 2000); //TODO make changeable
	
	const gClient = site == "MPP" ? new Client("ws://www.multiplayerpiano.com:443") : site == "WOPP" ? new Client("ws://ourworldofpixels.com:1234", true) : site == "MPT" ? new Client("ws://ts.terrium.net:8080", true) : site == "VFDP" ? new Client("ws://www.visualfiredev.com:8080") : undefined;
	if (!gClient) return console.error(`Invalid site ${site}`);
	gClient.setChannel(/*(site == "MPP" && room == "lobby") ? "lolwutsecretlobbybackdoor" : */room);
	gClient.canConnect = true;
	clientConnector.enqueue(gClient);

	
	
	var isConnected = false;
	gClient.on('connect', () => {
		console.log(`Connected to room ${room} of ${site} server`);
		dSend(`**Connected**`); // TODO say what room it actually connected to ?
		gClient.sendArray([{m: "userset", set: {name: config.mppname}}])
		isConnected = true;
	});
	gClient.on('disconnect', () => {
		if (isConnected) {
			console.log(`Disconnected from room ${room} of ${site} server`);
			dSend(`**Disconnected**`);
			isConnected = false;
		}
		clientConnector.enqueue(gClient);
	});
	/*gClient.on('status', status => {
		console.log(`[${site}] [${room}] ${status}`);
	});*/
		
	let lastCh = room;
	gClient.on('ch', msg => {
		if (lastCh && msg.ch._id !== lastCh) {
			dSend(`**Channel changed from \`${lastCh}\` to \`${msg.ch._id}\`**`);
			console.log(`[${site}][${room}] Channel changed from ${lastCh} to ${msg.ch._id}`);
			lastCh = msg.ch._id;
		}
		(async function(){
			// catch dropped crown
			if (msg.ch.crown && !msg.ch.crown.hasOwnProperty('participantId')) {
				gClient.sendArray([{m:'chown', id: gClient.getOwnParticipant().id}]); // if possible
				var avail_time = msg.ch.crown.time + 15000 - gClient.serverTimeOffset;
				var ms = avail_time - Date.now();
				setTimeout(()=> gClient.sendArray([{m:'chown', id: gClient.getOwnParticipant().id}]) , ms);
			}
			// transfer crown to owner
			if (msg.ppl && msg.ch.crown && msg.ch.crown.participantId == gClient.getOwnParticipant().id) {
				var res = await dbClient.query("SELECT owner_mpp__id FROM bridges WHERE mpp_room = $1 AND site = $2;", [room, site]);
				if (res.rows.length == 0) return;
				var owner = res.rows[0].owner_mpp__id;
				if (!owner) return;
				msg.ppl.some(part => {
					if (part._id == owner) {
						gClient.sendArray([{m:'chown', id: part.id}]);
						return true;
					} else return false;
				});
			}
		})();
	});

	// MPP to Discord
	gClient.on('a', msg => {
		if (msg.p._id == gClient.getOwnParticipant()._id) return;
		var id = msg.p._id.substr(0,6);
		var name = msg.p.name.replace(/discord.gg\//g, 'discord.gg\\/');
		var str = `\`${id}\` **${name}:** ${msg.a}`;
		str = str.replace(/<@/g, "<\\@");
		dSend(str);
	});

	// Discord to MPP
	dClient.on('message', message => {
		if (message.channel.id !== DiscordChannelID || message.author.bot || message.content.startsWith('!')) return;
		var str = message.cleanContent;
		var arr = [];
		if (str.startsWith('/') || str.startsWith('\\')) {
			arr.push({m:"a", message:
				`⤹ ${message.member.displayName}`
			});
		} else str = message.member.displayName + ': ' + str;
		if (str.startsWith('\\')) str = str.slice(1);
		if (message.attachments.first()) str += ' '+message.attachments.first().url;
		if (str.length > 512) str = str.substr(0,511) + '…';
		arr.push({m:"a", message:str});
		gClient.sendArray(arr);
	});

	// announce join/leave
	gClient.on('participant added', participant => {                      //TODO universal way of filtering names
		dSend(`**\`${participant._id.substr(0,6)}\` ${participant.name.replace(/<@/g, "<\\@")} entered the room.**`);
	});
	gClient.on('participant removed', participant => {
		dSend(`**\`${participant._id.substr(0,6)}\` ${participant.name.replace(/<@/g, "<\\@")} left the room.**`);
	});


	/*// autoban banned participants
	gClient.on('participant added', part => {
		if (PS.banned_ppl.hasOwnProperty(part._id) && gClient.isOwner())
			gClient.sendArray([{m: "kickban", _id: part._id, ms: 60*60*1000}]);
	});*/


	gClient.on('notification', async msg => {

		// show notification
		_dSend(undefined, {
			title: msg.title,
			description: msg.text || msg.html
		});

		// ban handling
		if (msg.text && (msg.text.startsWith('Banned from') || msg.text.startsWith('Currently banned from'))) {
            // Banned from "{room}" for {n} minutes.
            // Currently banned from "{room}" for {n} minutes.
			let arr = msg.text.split(' ');
			arr.pop();
			let minutes = arr.pop();

			gClient.stop();
			setTimeout(()=>{
				gClient.setChannel(room);
				gClient.start();
			}, minutes*60*1000+3000);
			dSend(`**Attempting to rejoin in ${minutes} minutes.**`);
		}
    });
    
	gClient.on("ch", function(msg){
		if (gClient.isOwner()) {
			if (gClient.countParticipants() <= 1) {
				gClient.sendArray([{m:'chset', set: { visible: false }}])	
			} else {
				gClient.sendArray([{m:'chset', set: { visible: true }}])	
			}
		}
	});
	
	
    
    // addons
	gClient.on('participant update', function(participant){
		nameCollector.collect(participant);
	});
	//if (site == 'MPP' && room == 'lobby') MPPrecorder.start(gClient);//TODO too much memory

	// collect data
	(async function(){
		var filename = `${site} ${room} .txt`.replace(/\//g, ':');
		var size = 0;
		var startDate = new Date();
		gClient.on('ws created', function(){
			gClient.ws.addEventListener('message', msg => {
				var data = msg.data;
				if (data instanceof ArrayBuffer) data = Buffer.from(data).toString('base64');
				var line = `${Date.now()} ${data}\n`;
				size += line.length;
				fs.appendFile(filename, line, ()=>{});
				if (size > 8000000) {save(); size = 0;}
			});
		});
		async function save(callback){
			console.log(`saving data recording`, filename)
			fs.readFile(filename, (err, file) => {
				if (err) return console.error(err);
				require('zlib').gzip(file, async function(err, gzip){
					if (err) return console.error(err);
					var attachmentName = `${site} ${room} raw data recording from ${startDate.toISOString()} to ${new Date().toISOString()} .txt.gz`;
					await DiscordChannel.send(new Discord.MessageAttachment(gzip, attachmentName));
					fs.writeFileSync(filename, '');
					size = 0;
					startDate = new Date();
					console.log(`saved raw data recording`, attachmentName);
					if (callback) callback();
				});
			});
		}
		exitHook(callback => {
			save(()=>callback());
		});
		gClient.dataCollectorSave = function(){save()}; // test
	})();

	if (!clients[site]) clients[site] = {};
	clients[site][room] = gClient;



	/*// EXPERIMENTAL
	gClient.on('ls', msg => {
		msg.u.forEach(async r => {
			if (clients[site][r._id]) return;
			for (let client of clientConnector.queue) {if (client.desiredChannelId == r._id) return} // ugg
			var discordChannelName = r._id.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
			var categoryID = '409079939501916160';
			var channel = await dClient.guilds.get(config.guildID).createChannel(discordChannelName, {parent: categoryID});
			channel.setTopic(`Bridged to http://www.multiplayerpiano.com/${encodeURIComponent(r._id)}`);
			var webhook = await channel.createWebhook('Webhook');
			createMPPbridge(r._id, channel.id, site, webhook.id, webhook.token);
		})
	})*/
}











global.nameCollector = {
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
};



global.MPPrecorder = {
	start: function(client) {
		var recorder = (require('./lib/mpprecorder-module.js'))(undefined, client);
		this.save = async function () {
			var startDate = new Date(recorder.startTime), endDate = new Date();
			var filename = `www.multiplayerpiano.com lobby recording from ${startDate.toISOString()} to ${endDate.toISOString()} .mid.gz`;
			var file = recorder.save();
			file = Buffer.from(file, 'binary');
			file = require('zlib').gzipSync(file);
			var attachment = new Discord.MessageAttachment(file, filename);
			await dClient.channels.get('394967426133000193').send(attachment);
		}
		this.interval = setInterval(() => {
			this.save();
		}, 10*60*1000);
		exitHook(callback => {
			this.save().then(callback);
		});
	}
};







// start
(async function () {
	var res = await dbClient.query('SELECT * FROM bridges;');

	var sites = {};
	res.rows.forEach(row => {
		if (row.disabled) return;
		if (!sites[row.site]) sites[row.site] = [];
		sites[row.site].push(row);
	});

	for (let site in sites) {
		let arr = sites[site];
		arr.sort((a, b) => {return a.position - b.position});
		let i = 0;
		arr.forEach(bridge => {
			setTimeout(function(){
				createMPPbridge(bridge.mpp_room, bridge.discord_channel_id, bridge.site, bridge.webhook_id, bridge.webhook_token, bridge.owner_mpp__id);
			}, i);
			i = i + 2000;
		});
	}
})();







// commands

commands.bridge = {
	usage: "<MPP room>",
	description: "Creates a bridge to the specified MPP room.",
	exec: async function (msg) {
		var site = 'MPP';
		var room = msg.txt(1);
		if (!room) return false;
		var existingBridge = (await dbClient.query('SELECT * FROM bridges WHERE mpp_room = $1;', [room])).rows[0];
		if (existingBridge) {
			if (!existingBridge.disabled) {
				return msg.reply(`${site} room ${room} is already bridged.`);
			} else {
				if (config.disabledRooms.includes(room)) {
					return msg.reply(`You cannot bridge this room.`);
				} else /* rebridge */ {
					let channel = dClient.guilds.get(config.guildID).channels.get(existingBridge.discord_channel_id);
					await dbClient.query("UPDATE bridges SET disabled = false WHERE mpp_room = $1", [room]);
					await channel.setParent('360557444952227851');
					await channel.lockPermissions();
					createMPPbridge(room, existingBridge.mpp_room, existingBridge.site, existingBridge.webhook_id, existingBridge.webhook_token);
					await msg.reply(`${site} room ${room} has been re-bridged.`);
					return;
				}
			}
		}
		/* new bridge */
		var discordChannelName = room.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
		var categoryID = '360557444952227851';
		var channel = await dClient.guilds.get(config.guildID).channels.create(discordChannelName, {parent: categoryID});
		channel.setTopic(`http://www.multiplayerpiano.com/${encodeURIComponent(room)}`);
		var webhook = await channel.createWebhook('Webhook');
		createMPPbridge(room, channel.id, site, webhook.id, webhook.token);
		dbClient.query('INSERT INTO bridges (site, mpp_room, discord_channel_id, webhook_id, webhook_token, owner_discord_user_id) VALUES ($1, $2, $3, $4, $5, $6)', [
			site, room, channel.id, webhook.id, webhook.token, msg.author.id, 
		]);
		msg.reply(`${site} room ${room} is now bridged to ${channel}.`);
	}
};

commands.unbridge = {
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
		clients.MPP[bridge.mpp_room].stop();
		var channel = dClient.channels.get(bridge.discord_channel_id)
		await channel.setParent('451838300068511745');
		await channel.lockPermissions();
		msg.reply(`${bridge.mpp_room} has been unbridged.`);
	}
}

commands.chown = {
	usage: "<'mpp'/'discord'> <Discord User ID or mention, or MPP _id>",
	description: "Changes the MPP or Discord owner of a private bridge. The first argument must be either `mpp` or `discord`.",
	aliases: ['changeowner', 'setowner'],
	exec: async function (msg) {
		if (msg.args.length < 3 || !['mpp','discord'].includes(msg.args[1])) return false;
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
			let po = msg.channel.permissionOverwrites.find('id', msg.author.id);
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

commands.list = {
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
