process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0; //TODO fix

var WebSocket = require('ws');
var Discord = require('discord.js');
var createWsMessageCollector = require('./datacollector');

var webhook = new Discord.WebhookClient(config.webhooks.ddp[0], config.webhooks.ddp[1], {disableEveryone:true});

var ws;
var wasConnected = false;
//var myId;

var collectWsMessage = createWsMessageCollector(async function(data, startDate, endDate){
    await webhook.send({files:[{
        attachment: data,
        name: `daydun piano main raw data recording from ${startDate.toISOString()} to ${endDate.toISOString()} .txt.gz`
    }]});
});

(function connect() {
    ws = new WebSocket("wss://daydun.com:5012/?nick=%5Bdiscord.gg%2Fk44Eqha%5D");
    ws.on("open", () => {
        if (!wasConnected) send2discord("**Connected**");
        wasConnected = true;
    });
    ws.on("message", message => {
        collectWsMessage(message);
        if (typeof message != 'string') return;
        var transmission = JSON.parse(message);
        if (transmission.type == 'chat') {
            let chatmsg = transmission.message;
            if (chatmsg.type == "message") {
                //if (chatmsg.id != myId)
                if (!chatmsg.content.startsWith('\u034f'))
                    send2discord(`**${sanitizeName(chatmsg.user.nick)}:** ${escapeDiscordMentions(chatmsg.content)}`);
            } else if (chatmsg.type == "join") {
                send2discord(`__***${sanitizeName(chatmsg.nick || chatmsg.id)} joined.***__`);
            } else if (chatmsg.type == "leave") {
                send2discord(`__***${sanitizeName(chatmsg.nick || chatmsg.id)} left.***__`);
            }
        } /*else if (transmission.type == 'load') {
            myId = transmission.id;
        }*/
    });
    ws.on("error", error => console.error(error));
    ws.on("close", () => {
        if (wasConnected) send2discord("**Disconnected**");
        wasConnected = false;
        setTimeout(connect, 5000);
    });
})();

function send2discord(message) {
    webhook.send(message, {split:{char:'',maxLength:2000}});
}

function send2ddp(message) {
    if (ws.readyState == WebSocket.OPEN) ws.send(JSON.stringify({type:"chat",message}));
}

dClient.on("local_message", message => {
    if (message.channel.id != "508890674138054667" || message.author.bot) return;
    var x = message.cleanContent;
    if (message.attachments.first()) x += " " + message.attachments.first().url;
    send2ddp(`\u034f${message.member.displayName}#${message.author.discriminator}: ${x}`);
});
