require('./util');
global.config = require('./config');
if (config.testmode) console.log('TEST MODE');
global.exitHook = require('async-exit-hook');
global.Discord = require('discord.js');
global.fs = require('fs');
global.dClient = new Discord.Client({ disableEveryone: true });


(require('mongodb').MongoClient).connect(config.MONGODB_URI).then(client=>{
	global.mdbClient = client;
	dClient.login(config.DISCORD_TOKEN);
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