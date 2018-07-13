require('./util');
global.exitHook = require('async-exit-hook');
global.Discord = require('discord.js');
global.fs = require('fs');
global.config = require('./config');
global.dClient = new Discord.Client({ disableEveryone: true });

console._log = console.log;
console.log = function(){
	console._log.apply(console, arguments);
	log2discord(arguments);
}
console._error = console.error;
console.error = function(){
	console._error.apply(console, arguments);
	log2discord(arguments);
}
console.warn = console.error;
console.info = console.log;

var webhook = new Discord.WebhookClient(config.webhooks.console[0], config.webhooks.console[1]);
function log2discord(str){
	str = Array.from(str);
	str = str.map(require('util').inspect);
	str = str.join(' ');
	webhook.send(str, {split:{char:''}});
}

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