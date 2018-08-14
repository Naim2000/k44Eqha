require('./util');
global.config = require('./config');
if (config.testmode) console.log('TEST MODE');
global.exitHook = require('async-exit-hook');
global.Discord = require('discord.js');
global.fs = require('fs');
global.dClient = new Discord.Client({ disableEveryone: true });

// error handling
{
	let webhook = new Discord.WebhookClient(config.webhooks.error[0], config.webhooks.error[1]);
	global.onError = function logError(error) {
		let msg = error.stack || error.message || error;
		console.error(msg);
		try {
			webhook.send(`\`\`\`\n${msg}\n\`\`\``).catch(()=>{});
		} catch(e) {}
	}
	process.on('unhandledRejection', onError);
	process.on('uncaughtException', onError);
	dClient.on('error', onError);
	dClient.on('warn', onError);
}


global.dbClient = new (require('pg').Client)({
	connectionString: process.env.DATABASE_URL,
	ssl: !testmode,
});
console.log("Connecting to Postgres…")
dbClient.connect().then(function(){
	console.log("Connecting to MongoDB…");
	(require('mongodb').MongoClient).connect(config.MONGODB_URI).then(client=>{
		global.mdbClient = client;
		console.log("Connecting to Discord…");
		dClient.login(config.DISCORD_TOKEN);
	});
});

dClient.once('ready', () => {
	console.log('Discord Client Ready');
	dClient.defaultGuild = dClient.guilds.get(config.guildID);

	require('./commands');
		require('./colorroles');
		require('./mppbridger');
	require('./screenshotter');
	require('./misc');

});