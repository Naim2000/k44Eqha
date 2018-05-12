global.commands = {
	"help": {
		usage: "[command]",
		aliases: ["commands"],
		exec: async function (msg) {
			if (msg.args[1]) {
				var commandName = msg.args[1];
				var command = commands[commandName];
				if (!command)
					for (let cmdNme in commands) {
						let cmd = commands[cmdNme];
						if (cmd.aliases && cmd.aliases.includes(commandName)) {command = cmd; break;}
					}
				if (!command) return msg.react('❓');
				var str = '`'+`!${commandName} ${command.usage || ''}`.trim()+'`\n';
				if (command.hasOwnProperty('aliases')) str += `**Aliases:** \`!${command.aliases.join(', !')}\`\n`;
				if (command.hasOwnProperty('description')) str += `\n${command.description}`;
				msg.channel.send({embed:{
					description: str
				}});
			} else {
				var cmdArr = [];
				for (var command in commands) {
					if (!commands[command].op) cmdArr.push(`!${command}`);
				}
				var embed = {
					title: "Commands",
					description: cmdArr.join(', '),
					footer: {text: "Use `!help <command>` for more info on a command."}
				};
				msg.channel.send({embed});
			}
		}
	},


	"createtextchannel":{
		usage: "<name>",
		description: "Creates a generic text channel in this server and gives you full permissions for it.",
		exec: async function (msg) {
			if (!msg.args[0]) return false;
			//var name = msg.txt(1).replace(/[^a-zA-Z0-9]/g, '-').substr(0,100).toLowerCase();
			var name = msg.txt(1);
			msg.guild.createChannel(name, {
				parent: '399735134061985792',
				overwrites: [
					{
						id: msg,
						allow: [
							"SEND_MESSAGES",
							"MANAGE_MESSAGES",
							"MANAGE_CHANNELS",
							"MANAGE_ROLES",
							"MANAGE_WEBHOOKS"
						]
					}
				]
			}).then(channel => {
				msg.reply(`${channel}`);
			}, error=>{
				msg.reply(`:warning: Failed to create channel. \`\`\` ${error} \`\`\``);
			});
		}
	},

	'delete': {
		usage: "[channel]",
		aliases: ['archive'],
		description: "Archives a channel that you have permission to delete.",
		exec: async function (msg) {
			if (msg.args[1]) {
				var channel = msg.mentions.channels.first();
				if (!channel) {
					msg.react(`⚠`);
					return;
				}
			} else {
				var channel = msg.channel;
			}
			if (!channel.permissionsFor(msg.member).has('MANAGE_CHANNELS')) return msg.react('🚫');
			await channel.setParent('425054198699261953');
			await channel.lockPermissions();
			msg.react('🆗');
		}
	},


	"eval": {
		op: true,
		usage: "<javascript>",
		aliases: ['>'],
		exec: async function (message) {
			var msg = message, m = message,
			guild = message.guild,
			channel = message.channel,
			send = message.channel.send,
			member = message.member,
			client = dClient;
			try {
				var out = eval(message.content.substr(2));
			} catch (error) {
				var out = error;
			} finally {
				message.channel.send('`'+out+'`', {split:{char:''}});
			}
		}
	},
	"query": {
		description: "Queries the Heroku PostgreSQL database",
		usage: "<query>",
		aliases: ['q', 'db', 'sql', '?'],
		op: true,
		exec: async function (msg) {
			dbClient.query(msg.txt(1), (err, res) => {
				var str = err || JSON.stringify(res);
				msg.channel.send(str, {split:{char:''}});
			});
		}
	},

}









dClient.on('message', message => {
	if (message.guild.id != config.guildID) return;
	if (!message.content.startsWith('!')) return;
	if (message.author.id === dClient.user.id) return;
	if (message.guild && message.guild.id !== config.guildID) return;
	
	var args = message.content.split(' ');
	var cmd = args[0].slice(1).toLowerCase();
	var txt = function(i){return args.slice(i).join(' ').trim()};
	
	message.args = args;
	message.cmd = cmd;
	message.txt = function(i){return this.args.slice(i).join(' ')};
	if (!message.guild) message.guild = dClient.guilds.get(config.guildID);
	if (!message.member) message.member = dClient.guilds.get(config.guildID).members.get(message.author.id);
	
	/*if (commands.hasOwnProperty(cmd)) {
		var command = commands[cmd];
		if (command.op && message.author.id !== op) return message.react('🚫');
		try {
			command.exec(message, args, txt);
		} catch(e) {
			message.reply(`:warning: An error occured while processing your command.`);
			console.error(e.stack);
		}
	}*/
	
	Object.keys(commands).forEach(commandName => {
		var command = commands[commandName];
		if (!(commandName === cmd || (command.aliases && command.aliases.includes(cmd)))) return;
		if (command.op && message.author.id !== config.opID) return message.react('🚫');
		/*try {
			var d = command.exec(message, args, txt);
			if (d === false) message.channel.send(`**Usage:** \`!${commandName} ${command.usage}\``);
		} catch(e) {
			message.reply(`:warning: An error occured while processing your command.`);
			console.error(e.stack);
		}*/

		command.exec(message, args, txt).then(
			(res) => {
				if (res === false) message.channel.send(`**Usage:** \`!${commandName} ${command.usage}\``);
			},
			(rej) => {
				message.reply(`:warning: An error has been encountered while processing your command.`);
				console.error(rej.stack || rej);
			}
		)
	});
});