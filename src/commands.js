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

	'delete': {
		usage: "[channel]",
		aliases: ['archive'],
		hidden: true,
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
			await channel.setParent(config.channels.deleted_channels);
			await new Promise(resolve => setTimeout(resolve, 500));
			await channel.lockPermissions();
			msg.react('🆗');
		}
	},


	"eval": {
		op: true,
		description: "Evaluate javascript",
		usage: "<code>",
		aliases: ['>'],
		exec: async function (message) {
			var msg = message, m = message,
			guild = message.guild,
			channel = message.channel,
			member = message.member,
			client = dClient,
			send = function(){
				channel.send.apply(channel, arguments);
			},
			say = send;
			try {
				var out = eval(message.content.substr(2));
			} catch (error) {
				var out = error;
			} finally {
				message.channel.send('`'+out+'`', {split:{char:''}});
			}
		}
	},

	"exec": {
		op: true,
		description: "Run a shell command",
		usage: "<command>",
		aliases: ["$"],
		exec: async function (msg) {
			require("child_process").exec(msg.txt(1), function(error, stdout, stderr){
				if (error)  msg.channel.send(error,  {split:{char:'',maxLength:2000}});
				if (stdout) msg.channel.send(stdout, {split:{char:'',maxLength:2000}});
				if (stderr) msg.channel.send(stderr, {split:{char:'',maxLength:2000}});
			})
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









dClient.on('local_message', async message => {
	if (!message.content.startsWith('!')) return;
	if (message.author.id === dClient.user.id) return;
	
	var args = message.content.split(' ');
	var cmd = args[0].slice(1).toLowerCase();
	var txt = function(i){return args.slice(i).join(' ').trim()};
	
	message.args = args;
	message.cmd = cmd;
	message.txt = function(i){return this.args.slice(i).join(' ')};
	if (!message.guild) message.guild = dClient.guilds.get(config.guildID);
	if (!message.member) message.member = dClient.guilds.get(config.guildID).members.get(message.author.id);
	
	Object.keys(commands).forEach(commandName => {
		var command = commands[commandName];
		if (!(commandName === cmd || (command.aliases && command.aliases.includes(cmd)))) return;
		if (command.op && !config.opIDs.includes(message.author.id)) return message.react('🚫');
		command.exec(message, args, txt).then(
			(res) => {
				switch (res) {
					case "ENOTBRIDGE":
						message.channel.send(random([
							`This is not a bridged channel.`,
							`You can only use this command in a bridged channel.`
						]));
						break;
					case "EBADUSG":
						message.channel.send(`**Usage:** \`!${commandName} ${command.usage}\``);
						break;
				}
			},
			(err) => {
				message.reply(`:warning: An error occured: \`\`\`\n${err.stack}\n\`\`\`<@281134216115257344>`);
				console.error(err.stack);
			}
		)
	});
});
