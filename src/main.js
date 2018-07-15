require('./util');
global.config = require('./config');
if (config.testmode) console.log('TEST MODE');
global.exitHook = require('async-exit-hook');
global.Discord = require('discord.js');
global.fs = require('fs');
global.dClient = new Discord.Client({ disableEveryone: true });

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

	require('./commands');
		require('./colorroles');
		require('./mppbridger');
	require('./screenshotter');
	require('./misc');

});
dClient.on('error', console.error);
dClient.on('warn', console.warn);