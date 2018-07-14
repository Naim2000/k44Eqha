var Client = require('../lib/Client.js');
global.clients = {};



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



global.createMPPbridge = function createMPPbridge(room, DiscordChannelID, site = 'MPP', webhookID, webhookToken) {
	var DiscordChannel = dClient.channels.get(DiscordChannelID);
	if (!DiscordChannel) return console.error(`Couldn't bridge ${site} ${room} because Discord Channel ${DiscordChannelID} is missing!`);
	if (webhookID && webhookToken) var webhook = new Discord.WebhookClient(webhookID, webhookToken, {disableEveryone:true});
	

	// discord message sending
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
	



	const gClient = 
		site == "MPP"  ? new Client("ws://www.multiplayerpiano.com:443") :
		site == "WOPP" ? new Client("ws://ourworldofpixels.com:1234") :
		site == "MPT"  ? new Client("ws://ts.terrium.net:8080") :
		site == "VFDP" ? new Client("ws://www.visualfiredev.com:8080") :
		undefined;
	if (!gClient) return console.error(`Invalid site ${site}`);
	gClient.setChannel(/*(site == "MPP" && room == "lobby") ? "lolwutsecretlobbybackdoor" : */room);
	gClient.canConnect = true;
	clientConnector.enqueue(gClient);

	

	
	var isConnected = false;
	gClient.on('connect', () => {
		console.log(`Connected to room ${room} of ${site} server`);
		dSend(`**Connected**`); // TODO say what room it actually connected to ?
		isConnected = true;
	});
	gClient.on('hi', ()=>{
		if (!testmode) gClient.sendArray([{m: "userset", set: {name: config.mppname}}])
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
		// announce channel change
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
	gClient.on('participant added', participant => {
		dSend(`**\`${participant._id.substr(0,6)}\` ${participant.name.replace(/<@/g, "<\\@")} entered the room.**`);
	});
	gClient.on('participant removed', participant => {
		dSend(`**\`${participant._id.substr(0,6)}\` ${participant.name.replace(/<@/g, "<\\@")} left the room.**`);
	});




	gClient.on('notification', async msg => {
		// show notification
		_dSend(undefined, {
			title: msg.title,
			description: msg.text || msg.html
		});

		// handle bans
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
	

	// autoban perma-banned users
	gClient.on("participant added", async part => {
		var bridge = (await dbClient.query("SELECT bans FROM bridges WHERE discord_channel_id = $1", [DiscordChannelID])).rows[0];
		for (let x of bridge.bans)
			if (part._id.startsWith(x))
				gClient.sendArray([{m: "kickban", _id: part._id, ms: 60*60*1000}]);
	})
	


	// make room invisible when nobody else is in it
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
	{
		// collect names
		gClient.on('participant update', function(participant){
			require('./namecollector').collect(participant);
		});
		// record raw data
		require('./datacollector')(gClient, site, room, DiscordChannel);
	}

	if (!clients[site]) clients[site] = {};
	clients[site][room] = gClient;
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
commands.bridge = require('./commands/bridge');
commands.unbridge = require('./commands/unbridge');
commands.chown = require('./commands/chown');
commands.list = require('./commands/list');
