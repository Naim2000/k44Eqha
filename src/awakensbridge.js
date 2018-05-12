global.awakensBridge = {}
awakensBridge.connect = function (uri, options) {
	var io = require('socket.io-client');
	var channel = new Discord.WebhookClient('342850770594562060', config.webhooks.awakens, {disableEveryone:true} );
	this.channel = channel;
	//test//var channel = new Discord.WebhookClient('399378912020529153', 'wdVr8ZvssmX9IF4cqS9dq3pxTUX9a9dNGN6Pusu5AzX60DQqBsWe6qxLagrFPgxksJQI', {disableEveryone:true} );
	var socket = io(uri||`http://this.awakens.me`, options||{
		extraHeaders: {
			'cf-connecting-ip': randomIp()
		}
	});
	this.socket = socket;

	socket.on('connect', function() {
		console.log('Connected to awakens.me');
		var ip = socket.io && socket.io.opts && socket.io.opts.extraHeaders && socket.io.opts.extraHeaders['cf-connecting-ip'];
		channel.send(ip ? `**Connected with fake IP address \`${ip}\`**` : '**Connected**');
		socket.emit('requestJoin');
	});
	socket.on('disconnect', function() {
		console.log('Disconnected from awakens.me');
		channel.send('**Disconnected**');
	});

	var online = {};
	socket.on('channeldata', (channel) => {
		if (channel.users) {
			channel.users.forEach(user => {
				online[user.id] = user.nick;
			});
		}
	});
	socket.on('nick', (id, newNick) => {
		var str = `**\\*\\* ${online[id]} is now known as ${newNick} \\*\\***`;
		//console.log(str);
		channel.send(str);
		online[id] = newNick;
	});
	socket.on('joined', (id, nick) => {
		var str = `**\\*\\* ${nick} has joined \\*\\***`;
		//console.log(str);
		channel.send(str);
		online[id] = nick;
	});
	socket.on('left', (id, part) => {
		var str = `**\\*\\* ${online[id]} has left${part ? ": "+part : ""} \\*\\***`;
		//console.log(str);
		channel.send(str);
	});

	socket.on('message', function(messageData) {
		switch (messageData.messageType) {
			default: {
				if (typeof messageData.message != 'string') return console.error(messageData);
				let msg = messageData.nick ? `**${messageData.nick}:** ${filter(messageData.message)}` : `**\\*\\* ${messageData.message} \\*\\***`;
				//console.log(msg);
				channel.send(msg, {split:{char:''}});
		
				/*if (messageData.message.startsWith("You've been kicked")) {
					console.log('Kicked from ', socket.io.uri);
				}
				if (messageData.message.startsWith("You've been banned")) {
					console.log('Banned from ', socket.io.uri);
				}*/

				if (messageData.message.startsWith("You've been kicked") || messageData.message.startsWith("You've been banned")) {
					let ms = Math.random()*1000000;
					setTimeout(function(){
						awakensBridge.connect(); // create new socket with different ip header
					}, ms);
					channel.send(`**Reconnecting in \`${ms/60000}\` minutes.**`);
				}

				break;
			}
			case "chat-image": {
				let msg = `**${messageData.nick}:**`;
				let img = Buffer.from(messageData.message.img, 'binary');
				let attachment = new Discord.MessageAttachment(img, 'image.'+messageData.message.type.split('/')[1]);
				channel.send(msg, attachment);
			}
		}
	});


	/*client.on('message', message => {
		if (message.author !== client.user && message.channel === channel) {
			socket.emit('message', `/*${message.member.displayName}:| ${message.content}`);
		}
	});*/

}


awakensBridge.connect();


/////////////////////////////////////////////////////////////////////////

function filter(str) {
	// escape
        // Convert chars to html codes
        //str = str.replace(/\n/g, '\\n');
    //    str = str.replace(/&/gi, '&amp;');
    //    str = str.replace(/>/gi, '&gt;');
        //str = str.replace(/</gi, '&lt;');
        //str = str.replace(/"/gi, '&quot;');
        //str = str.replace(/#/gi, '&#35;');
        //str = str.replace(/\\n/g, '<br>');
        //str = str.replace(/\$/gi, '&#36;');
        //str = str.replace(/'/gi, '&#39;');
        //str = str.replace(/~/gi, '&#126;');

        //convert spaces
        //str = str.replace(/\s{2}/gi, ' &nbsp;');

        //str = str.replace(/(<br>)(.+)/g, '<div style="display:block;padding-left:3.5em;">$2</div>');

	var coloreg = 'yellowgreen|yellow|whitesmoke|white|wheat|violet|turquoise|tomato|thistle|teal|tan|steelblue|springgreen|snow|slategray|slateblue|skyblue|silver|sienna|seashell|seagreen|sandybrown|salmon|saddlebrown|royalblue|rosybrown|red|rebeccapurple|purple|powderblue|plum|pink|peru|peachpuff|papayawhip|palevioletred|paleturquoise|palegreen|palegoldenrod|orchid|orangered|orange|olivedrab|olive|oldlace|navy|navajowhite|moccasin|mistyrose|mintcream|midnightblue|mediumvioletred|mediumturquoise|mediumspringgreen|mediumslateblue|mediumseagreen|mediumpurple|mediumorchid|mediumblue|mediumaquamarine|maroon|magenta|linen|limegreen|lime|lightyellow|lightsteelblue|lightslategray|lightskyblue|lightseagreen|lightsalmon|lightpink|lightgreen|lightgray|lightgoldenrodyellow|lightcyan|lightcoral|lightblue|lemonchiffon|lawngreen|lavenderblush|lavender|khaki|ivory|indigo|indianred|hotpink|honeydew|greenyellow|green|gray|goldenrod|gold|ghostwhite|gainsboro|fuchsia|forestgreen|floralwhite|firebrick|dodgerblue|dimgray|deepskyblue|deeppink|darkviolet|darkturquoise|darkslategray|darkslateblue|darkseagreen|darksalmon|darkred|darkorchid|darkorange|darkolivegreen|darkmagenta|darkkhaki|darkgreen|darkgray|darkgoldenrod|darkcyan|darkblue|cyan|crimson|cornsilk|cornflowerblue|coral|chocolate|chartreuse|cadetblue|transparent|burlywood|brown|blueviolet|blue|blanchedalmond|black|bisque|beige|azure|aquamarine|aqua|antiquewhite|aliceblue';

	// fonts
	str = str.replace(/(\$|(&#36;))([\w \-\,Ã‚Â®]*)\|(.*)$/g, "$4");
	str = str.replace(/(\£|(£))([\w \-\,Ã‚Â®]*)\|(.*)$/g, "$4");

	// colors
	str = str.replace(/###([\da-f]{6}|[\da-f]{3})(.+)$/gi, '$2');
	str = str.replace(/##([\da-f]{6}|[\da-f]{3})(.+)$/gi, '$2');
	str = str.replace(/#([\da-f]{6}|[\da-f]{3})(.+)$/gi, '$2');
	str = str.replace(RegExp('###(' + coloreg + ')(.+)$', 'gi'), '$2');
	str = str.replace(RegExp('##(' + coloreg + ')(.+)$', 'gi'), '$2');
	str = str.replace(RegExp('#(' + coloreg + ')(.+)$', 'gi'), '$2');

	// styles
	str = str.replace(/\/\%%([^\%%]+)\%%/g, '$1');
	str = str.replace(/\/\^([^\|]+)\|?/g, '$1');
	str = str.replace(/\/\*([^\|]+)\|?/g, '$1');
	str = str.replace(/\/\%([^\|]+)\|?/g, '$1');
	str = str.replace(/\/\_([^\|]+)\|?/g, '$1');
	str = str.replace(/\/\-([^\|]+)\|?/g, '$1');
	str = str.replace(/\/\~([^\|]+)\|?/g, '$1');
	str = str.replace(/\/\#([^\|]+)\|?/g, '$1');
	str = str.replace(/\/\+([^\|]+)\|?/g, '$1');
	str = str.replace(/\/\!([^\|]+)\|?/g, '$1');
	str = str.replace(/\/\$([^\|]+)\|?/g, '$1');
	str = str.replace(/\/\@([^\|]+)\|?/g, '$1');

	return str;
}

/*
function filter(str) {
	var multiple = function (str, mtch, rep, limit) {
		var ct = 0;
		limit = limit || 3000;
		while (str.match(mtch) !== null && ct++ < limit) {
			str = str.replace(mtch, rep);
		}
		return str;
	};
	var coloreg = 'yellowgreen|yellow|whitesmoke|white|wheat|violet|turquoise|tomato|thistle|teal|tan|steelblue|springgreen|snow|slategray|slateblue|skyblue|silver|sienna|seashell|seagreen|sandybrown|salmon|saddlebrown|royalblue|rosybrown|red|rebeccapurple|purple|powderblue|plum|pink|peru|peachpuff|papayawhip|palevioletred|paleturquoise|palegreen|palegoldenrod|orchid|orangered|orange|olivedrab|olive|oldlace|navy|navajowhite|moccasin|mistyrose|mintcream|midnightblue|mediumvioletred|mediumturquoise|mediumspringgreen|mediumslateblue|mediumseagreen|mediumpurple|mediumorchid|mediumblue|mediumaquamarine|maroon|magenta|linen|limegreen|lime|lightyellow|lightsteelblue|lightslategray|lightskyblue|lightseagreen|lightsalmon|lightpink|lightgreen|lightgray|lightgoldenrodyellow|lightcyan|lightcoral|lightblue|lemonchiffon|lawngreen|lavenderblush|lavender|khaki|ivory|indigo|indianred|hotpink|honeydew|greenyellow|green|gray|goldenrod|gold|ghostwhite|gainsboro|fuchsia|forestgreen|floralwhite|firebrick|dodgerblue|dimgray|deepskyblue|deeppink|darkviolet|darkturquoise|darkslategray|darkslateblue|darkseagreen|darksalmon|darkred|darkorchid|darkorange|darkolivegreen|darkmagenta|darkkhaki|darkgreen|darkgray|darkgoldenrod|darkcyan|darkblue|cyan|crimson|cornsilk|cornflowerblue|coral|chocolate|chartreuse|cadetblue|transparent|burlywood|brown|blueviolet|blue|blanchedalmond|black|bisque|beige|azure|aquamarine|aqua|antiquewhite|aliceblue';

	// fonts
	str = multiple(str, /(\$|(&#36;))([\w \-\,Ã‚Â®]*)\|(.*)$/, '$4');
	str = multiple(str, /(\£|(£))([\w \-\,Ã‚Â®]*)\|(.*)$/, '$4');

	// colors
	str = multiple(str, /&#35;&#35;&#35;([\da-f]{6}|[\da-f]{3})(.+)$/i, '$2');
	str = multiple(str, /&#35;&#35;([\da-f]{6}|[\da-f]{3})(.+)$/i, '$2');
	str = multiple(str, /&#35;([\da-f]{6}|[\da-f]{3})(.+)$/i, '$2');
	str = multiple(str, RegExp('&#35;&#35;&#35;(' + coloreg + ')(.+)$', 'i'), '$2');
	str = multiple(str, RegExp('&#35;&#35;(' + coloreg + ')(.+)$', 'i'), '$2');
	str = multiple(str, RegExp('&#35;(' + coloreg + ')(.+)$', 'i'), '$2');

	// styles
	str = multiple(str, /\/\%%([^\%%]+)\%%/g, '$1');
	str = multiple(str, /\/\^([^\|]+)\|?/g, '$1');
	str = multiple(str, /\/\*([^\|]+)\|?/g, '$1');
	str = multiple(str, /\/\%([^\|]+)\|?/g, '$1');
	str = multiple(str, /\/\_([^\|]+)\|?/g, '$1');
	str = multiple(str, /\/\-([^\|]+)\|?/g, '$1');
	str = multiple(str, /\/\&#126;([^\|]+)\|?/g, '$1');
	str = multiple(str, /\/\&#35;([^\|]+)\|?/g, '$1');
	str = multiple(str, /\/\+([^\|]+)\|?/g, '$1');
	str = multiple(str, /\/\!([^\|]+)\|?/g, '$1');
	str = multiple(str, /\/\&#36;([^\|]+)\|?/g, '$1');
	str = multiple(str, /\/\@([^\|]+)\|?/g, '$1');

	return str;
}
*/


function randomByte() {
	return Math.round(Math.random()*256);
}

function randomIp() {
	var ip = randomByte() +'.' +
		randomByte() +'.' +
		randomByte() +'.' +
		randomByte();
	return ip;
}