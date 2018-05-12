global.exitHook = require('async-exit-hook');
global.Discord = require('discord.js');
global.fs = require('fs');
global.config = require('./config.json');
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

var webhook = new Discord.WebhookClient('405445543536623627', config.webhooks.console);
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
	dClient.login(config.testmode ? config.test_token : config.token);
});

dClient.once('ready', () => {
	console.log('Discord Client Ready');

	require('./commands.js');
		require('./colorroles.js');
		require('./mppbridger.js');
	require('./owopbridge.js');
	//require('./awakensbridge.js');
	require('./screenshotter.js');
	require('./misc.js');

	// backup
	dClient.channels.get('394962139644690432').send(new Discord.MessageAttachment(global['files.zip'], 'files.zip'));
	delete global['files.zip'];
});
dClient.on('error', console.error);
dClient.on('warn', console.warn);