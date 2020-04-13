require('./util');
global.config = require('./config');
if (config.testmode) console.log('TEST MODE');
global.exitHook = require('async-exit-hook');
global.Discord = require('discord.js');
global.fs = require('fs');
global.dClient = new Discord.Client({ 
	disableMentions: 'all',
	presence: {
		activity: {
            name: `with Lamp`, //i think you're gonna comment this out whatever
            type: 'PLAYING' //does look nice 
        },
        status: 'online',
	} 
});

// error handling
{
	let webhook = new Discord.WebhookClient(config.webhooks.error[0], config.webhooks.error[1]);
	global.onError = function logError(error, title) {
		let msg = error && (error.stack || error.message || error);
		console.error(title + ':\n', msg);
		try {
			webhook.send(`${title ? `**${title}:**` : ""}\`\`\`js\n${msg}\n\`\`\``).catch(()=>{}); // that js right there adds a kinda color // you know this
		} catch(e) {}
	}
	process.on('unhandledRejection', error => onError(error, "Unhandled Rejection"));
	exitHook.uncaughtExceptionHandler(error => onError(error, "Uncaught Exception"));
	dClient.on('error', error => onError(error, "Discord Client Error"));
	dClient.on('warn', error => onError(error, "Discord Client Warning"));
	//dClient.on('debug', console.log) // please don't do this if you don't want tons of WS Heartbeat things popping up in console : https://i.imgur.com/C9wP73e.png
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
	}, function(err){
		console.error("Failed to connect to MongoDB:\n", err.stack);
		process.exit(1);
	});
}, function(err){
	console.error("Failed to connect to Postgres:\n", err.stack);
	process.exit(1);
});

dClient.once('ready', () => {
	console.log('Discord Client Ready');
	dClient.defaultGuild = dClient.guilds.resolve(config.guildID);

	require('./local_events');
	require('./commands');
		require('./colorroles');
		require('./mppbridger');
	require('./screenshotter');
	require('./misc');
	require('./ddpbridge');
	require('./prbridge');
	require('./rocketbridge.js');

});
