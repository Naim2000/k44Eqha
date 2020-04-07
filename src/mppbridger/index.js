var Client = require('../lib/Client.js');
global.clients = {};

global.createMPPbridge = function createMPPbridge(room, DiscordChannelID, site = 'MPP', webhookID, webhookToken) {
	var DiscordChannel = dClient.channels.get(DiscordChannelID);
	if (!DiscordChannel) return console.error(`Couldn't bridge ${site} ${room} because Discord Channel ${DiscordChannelID} is missing!`);
	if (webhookID && webhookToken) var webhook = new Discord.WebhookClient(webhookID, webhookToken, {disableEveryone:true});
	

	// discord message sending
	{
		let msgBuffer = [];
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
		}, 3000);
	}
	



	const gClient = 
		site == "MPP"  ? new Client("ws://530s.gq:28886") :
		site == "WOPP" ? new Client("wss://piano.ourworldofpixels.com") :
		site == "MPT"  ? new Client("wss://ts.terrium.net:8443") :
		site == "VFDP" ? new Client("ws://www.visualfiredev.com:8080") :
		site == "CMPC" ? new Client("ws://charsy.meowbin.com:16562") :
		site == "BIMP" ? new Client("ws://104.237.150.24:8513/") :
		undefined;
	if (!gClient) return console.error(`Invalid site ${site}`);
	gClient.setChannel(/*(site == "MPP" && room == "lobby") ? "lolwutsecretlobbybackdoor" : */room, {visible:false});
	gClient.start();

	// maintain the client's presence in the channel
	gClient.channelCorrectorInterval = setInterval(()=>{
		// if client is connected and not in a channel (meaning setChannel failed due to ratelimit because another client joined a channel with the same user within the last second) OR client is in a channel but it is not the right channel…
		if ((gClient.isConnected() && !gClient.channel) || (gClient.channel && gClient.channel._id != room)) 
			// …set the channel!
			gClient.setChannel(room, {visible:false}); 
	}, 1000);

	let lastError;
	gClient.on("error", error => {
		console.error(`[${site}][${room}]`, error.message);
		error = error.toString();
		if (lastError != error) {
			dSend(`**${error.toString()}**`);
			lastError = error;
		}
	});
	var isConnected = false; // TODO use gClient.isConnected() ?
	gClient.on('connect', () => {
		console.log(`[${site}][${room}] Connected to server`);
		dSend(`**Connected to server; joining channel…**`);
		isConnected = true;
		lastError = undefined;
	});
	gClient.on('hi', ()=>{
		console.log(`[${site}][${room}] Received greeting`);
		if (!testmode) {
			if (site == "MPP" /*&& room == "lobby"*/) {
				//gClient.sendArray([{m: "userset", set: {name: "Anonymous" }}]);
			} else {
				gClient.sendArray([{m: "userset", set: {name: config.mppname }}]);
			}
		}
		gClient.sendArray([{m:'m',x:Math.floor(Math.random()*100),y:Math.floor(Math.random()*100)}])
	});
	gClient.on('disconnect', () => {
		if (isConnected) {
			console.log(`[${site}][${room}] Disconnected from server`);
			dSend(`**Disconnected from server**`);
			isConnected = false;
		}
	});
	/*gClient.on('status', status => {
		console.log(`[${site}] [${room}] ${status}`);
	});*/
		


	// on channel change
	{
		let lastCh;
		gClient.on('ch', async msg => {
			// announce channel join
			if (!lastCh) {
				dSend(`**Joined channel \`${msg.ch._id}\`**`);
				console.log(`[${site}][${room}] Joined channel ${msg.ch._id}`);
			}
			// announce channel change
			else if (msg.ch._id !== lastCh) {
				dSend(`**Channel changed from \`${lastCh}\` to \`${msg.ch._id}\`**`);
				console.log(`[${site}][${room}] Channel changed from ${lastCh} to ${msg.ch._id}`);
			}
			lastCh = msg.ch._id;

		});
		gClient.on("disconnect", () => lastCh = undefined);
	}
	
	
	// on chown
	gClient.on('ch', async function(msg){
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
	});
	




	// MPP to Discord
	gClient.on('a', async msg => {
		if (msg.p._id == gClient.getOwnParticipant()._id) return;
		var id = msg.p._id.substr(0,6);
		var name = sanitizeName(msg.p.name);
		var content = escapeDiscordMentions(msg.a);
		var str = `\`${id}\` **${name}:** ${content}`;
		dSend(str);
	});

	// Discord to MPP
	{
		let msgQueue = [];
		dClient.on('message', async message => {
			if (message.channel.id !== DiscordChannelID || message.author.id == dClient.user.id || !message.member /*|| message.content.startsWith('!')*/) return;
			var str = message.cleanContent;
			var aname = `${message.member.displayName}#${message.member.user.discriminator}`;
			if (str.startsWith('/') || str.startsWith('\\')) 
				msgQueue.push(`⤹ ${aname}`);	
			else
				str = `${aname}: ${str}`;
			if (str.startsWith('\\')) str = str.slice(1);
			if (message.attachments.first()) str += ' '+message.attachments.first().url;
			if (str.length > 512) str = str.substr(0,511) + '…';
			msgQueue.push(str);
		});
		setInterval(()=>{
			gClient.sendArray([{m:'a', message: msgQueue.shift()}]);
		}, 1600); // just about fastest without exceeding quota; I figured quota is 4 messages per 6 seconds in lobbies
	}




	// announce join/leave/rename
	gClient.prependListener("p", async participant => {
	    if (gClient.ppl[participant.id]) { // is update
	        let oldName = gClient.ppl[participant.id].name, newName = participant.name;
	        if (newName != oldName)
	            dSend(`\`${participant._id.substr(0,6)}\` ___**${sanitizeName(oldName)}** changed their name to **${sanitizeName(newName)}**___`);
	    } else { // is join
	        dSend(`\`${participant._id.substr(0,6)}\` ___**${sanitizeName(participant.name)}** entered the room.___`);
	    }
	});
	gClient.prependListener("bye", async msg => {
	    var participant = gClient.ppl[msg.p];
        dSend(`\`${participant._id.substr(0,6)}\` ___**${sanitizeName(participant.name)}** left the room.___`);
    });



	// on notifications
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
		var bans = (await dbClient.query("SELECT bans FROM bridges WHERE discord_channel_id = $1", [DiscordChannelID])).rows[0].bans;
		if (!bans) return;
		for (let b of bans)
			if (part._id.startsWith(b))
				gClient.sendArray([{m: "kickban", _id: part._id, ms: 60*60*1000}]);
	})
	


	// make room invisible when nobody else is in it
	gClient.on("ch", async function(msg){
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
		//require('./datacollector')(gClient, site, room, DiscordChannel);
		let createWSMessageCollector = require("../datacollector")
		gClient.on("message", createWSMessageCollector(async function(data, startDate, endDate){
			var attachmentName = `${site} ${room} raw data recording from ${startDate.toISOString()} to ${endDate.toISOString()} .txt.gz`;
			await DiscordChannel.send(new Discord.MessageAttachment(data, attachmentName));
		}));
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
			createMPPbridge(bridge.mpp_room, bridge.discord_channel_id, bridge.site, bridge.webhook_id, bridge.webhook_token, bridge.owner_mpp__id);
		});
	}
})();










// commands
commands.bridge = require('./commands/bridge');
commands.unbridge = require('./commands/unbridge');
commands.chown = require('./commands/chown');
commands.list = require('./commands/list');
commands.ban = require('./commands/ban');

