(async function() {
    global.RocketChat = require("@rocket.chat/sdk");
    var driver = RocketChat.driver;
    var api = RocketChat.api;

    await driver.connect();
	await driver.login(); // using environment variables
    await driver.subscribeToMessages();
    
    var channelIdMap = {
        "321819041348190249" : "ozfexWkyGuitsnAhR", // main,
        "380431177812803584" : "3uSWaqgxCg8rEWjAa", // lab
        "484965488992976897" : "p2QQqJ6AMEX7xK9Pi", // code
        "372196271928246272" : "Q8CQNstBHEuyYFTxm", // media
        "360985607209484290" : "3z6wiTRgEJd9xbf9H", // midi-files
    };

    // discord to rocket
    dClient.on("local_message", async message => {
        if (message.author.id == dClient.user.id || (message.channel.wh && message.channel.wh.id == message.author.id)) return;
        var rid = channelIdMap[message.channel.id];
        if (!rid) return;
        var rcmsg = driver.prepareMessage();
        rcmsg.rid = rid;
        rcmsg.msg = message.cleanContent;
        rcmsg.alias = message.member && message.member.displayName || message.author.username;
        rcmsg.avatar = message.author.avatarURL || message.author.defaultAvatarURL;
        rcmsg.attachments = message.attachments.map(attachment => ({
            title: attachment.filename,
            title_link: attachment.url,
            title_link_download: true,
            image_url: attachment.width ? attachment.url : undefined,
            audio_url: [".ogg", ".mp3", ".wav", ".flac"].some(ext=>attachment.name.endsWith(ext)) ? attachment.url : undefined,
            video_url: [".mp4", ".webm", ".mov", ".avi"].some(ext=>attachment.name.endsWith(ext)) ? attachment.url : undefined
        }));
        message.rcmsg = await driver.sendMessage(rcmsg);
    });
	dClient.on("local_messageUpdate", async function (oldMessage, newMessage) {
		if (newMessage.rcmsg) {
			await api.post('chat.update', {
				roomId: newMessage.rcmsg.rid,
				msgId: newMessage.rcmsg._id,
				text: newMessage.cleanContent
			});
		}
	});
	dClient.on("local_messageDelete", async function (message) {
		if (message.rcmsg) {
			await api.post('chat.delete', {
				roomId: message.rcmsg.rid,
				msgId: message.rcmsg._id
			});
		}
	});



    // rocket to discord
    var receivedRcMsgIDs = [];
    driver.reactToMessages(async (e,m,mo) => {
        if (e) return console.error(e);
        if (receivedRcMsgIDs.includes(m._id)) return;
        else receivedRcMsgIDs.push(m._id);
        if (m.u._id == driver.userId) return;
        if (!m.mentions && !m.channels) return;
        var dcid;
        for (let x in channelIdMap) if (channelIdMap[X] == m.rid) dcid = x;
        if (!dcid) return;
        var dc = dClient.channels.get(dcid);
        if (!dc.wh) {
            dc.wh = (await dc.fetchWebhooks()).find(w=>w.name=="fookat bridge");
        }
        try {
			await dc.wh.send(m.msg,{
				username: `${m.u.username} @ fookat.tk`.substr(0,32),
				avatarURL: `https://fookat.tk/avatar/${m.u.username}?${process.pid}`,
				split: true,
				disableEveryone: true,
				embeds: m.attachments ? m.attachments.map(a => ({
					title: a.title,
					url: a.title_link ? "https://fookat.tk" + a.title_link : undefined,
					description: a.description,
					image: a.image_url ? {url: "https://fookat.tk" + a.image_url} : undefined
				})) : undefined
			});
		} catch(e) {
			console.error(e);
			await dc.send(`**${m.u.username}:** ${m.msg}`, {
				split: true,
				embeds: m.attachments ? m.attachments.map(a => ({
					title: a.title,
					url: a.title_link ? "https://fookat.tk" + a.title_link : undefined,
					description: a.description,
					image: a.image_url ? {url: "https://fookat.tk" + a.image_url} : undefined
				})) : undefined
			});
		}
    });
    
})();