require('./util');
global.exitHook = require('async-exit-hook');
global.Discord = require('discord.js');
global.fs = require('fs');
global.config = require('./config');
global.dClient = new Discord.Client({ disableEveryone: true });


process.on('unhandledRejection', (reason, promise) => {
	console.error(promise);
});
process.on('uncaughtException', error => {
	console.error(error.stack);
});


(require('mongodb').MongoClient).connect(process.env.MONGODB_URI).then(client=>{
	global.mdbClient = client;
	dClient.login(config.token);
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