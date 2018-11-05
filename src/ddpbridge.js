var WebSocket = require('ws');
var Discord = require('discord.js');

var ws;
var wasConnected = false;

(function connect() {
    ws = new WebSocket("wss://daydun.com:5012/?nick=%5Bdiscord.gg%2Fk44Eqha%5D");
    ws.on("open", () => {
        if (!wasConnected) send2discord("**Connected**");
        wasConnected = true;
    });
    ws.on("message", message => {
        if (typeof message != 'string') return;
        var transmission = JSON.parse(message);
        if (transmission.type == 'chat') {
            let chatmsg = transmission.message;
            if (chatmsg.type == "message") {
                send2discord(`**${chatmsg.nick}:** ${chatmsg.content}`);
            } else if (chatmsg.type == "join") {
                send2discord(`__***${chatmsg.nick || chatmsg.id} joined.***__`);
            } else if (chatmsg.type == "leave") {
                send2discord(`__***${chatmsg.nick || chatmsg.id} left.***__`);
            }
        }
    });
    ws.on("error", error => console.error(error));
    ws.on("close", () => {
        if (wasConnected) send2discord("**Disconnected**");
        wasConnected = false;
        setTimeout(connect, 5000);
    });
})();

var webhook = new Discord.WebhookClient(config.webhooks.ddp[0], config.webhooks.ddp[1], {disableEveryone:true});

function send2discord(message) {
    webhook.send(message, {split:{char:'',maxLength:2000}});
}

function send2ddp(message) {
    if (ws.readyState == WebSocket.OPEN) ws.send(message);
}

dClient.on("local_message", message => {
    if (message.channel.id != "508890674138054667") return;
    send2ddp(`${message.member.displayName}#${message.author.discriminator}: ${message.cleanContent}`);
});
