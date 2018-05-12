var striptags = require('striptags');
function createOWOPbridge(dClient, channelID, webhookID, webhookToken, OWOPworld = 'main', OWOPnick = '[Discord]'){
    var webhook = new Discord.WebhookClient(webhookID, webhookToken, {disableEveryone:true});
    var WebSocket = require('ws');
    var socket;
    var canConnect = true;
    function connect() {
        if (!canConnect) return;
        var myId;
        socket = new WebSocket("ws://ourworldofpixels.com:443/");
        socket.binaryType = "arraybuffer";
    
        var pingInterval;
        socket.addEventListener('open', () => {
            console.log('[OWOP] ws open');
            joinWorld(OWOPworld);
            sendMessage('/nick '+OWOPnick);
            pingInterval = setInterval(sendCursorActivity, 1000*60*5);
            webhook.send('**Connected**');
        });
        socket.addEventListener('close', () => {
            console.log('[OWOP] ws close');
            clearInterval(pingInterval);
            setTimeout(connect, 10000);
            webhook.send('**Disconnected**');
        });
        socket.addEventListener('error', console.error);
        socket.addEventListener('message', msg => {
            if (!myId) myId = extractId(msg.data);
            if (typeof msg.data != "string") return;
            if (myId && (msg.data.startsWith(`[${myId}]`) || msg.data.startsWith(myId))) return;
            webhook.send(striptags(msg.data));
        });
    } connect();
    
    dClient.on('message', message => {
        if (message.channel.id != channelID) return;
        var str = `${message.member.displayName}: ${message.cleanContent}`;
        if (message.attachments.first()) str += ' ' + message.attachments.first().url;
        if (str.length > 128) str = str.substr(0,127) + '…';
        sendMessage(str);
    });
    
    
    
    function joinWorld(name) {
        var nstr = stoi(name, 24);
        var array = new ArrayBuffer(nstr[0].length + 2);
        var dv = new DataView(array);
        for (var i = nstr[0].length; i--;) {
            dv.setUint8(i, nstr[0][i]);
        }
        dv.setUint16(nstr[0].length, 1337, true);
        socket.send(array);
        return nstr[1];
    }
    function stoi(string, max) {
        var ints = [];
        var fstring = "";
        string = string.toLowerCase();
        for (var i = 0; i < string.length && i < max; i++) {
            var charCode = string.charCodeAt(i);
            if (charCode < 123 && charCode > 96 || charCode < 58 && charCode > 47 || charCode == 95 || charCode == 46) {
                fstring += String.fromCharCode(charCode);
                ints.push(charCode);
            }
        }
        return [ints, fstring];
    }
    
    function sendMessage(str) {
        if (socket && socket.readyState == WebSocket.OPEN)
            socket.send(str + String.fromCharCode(10));
    }
    
    function sendCursorActivity() { // thx kit
        var arb = new ArrayBuffer(12);
        var dv = new DataView(arb);
        dv.setInt32(0, 0, true); // x
        dv.setInt32(4, 0, true); // y
        dv.setUint8(8, 0); // r
        dv.setUint8(9, 0); // g
        dv.setUint8(10, 0); // b
        dv.setUint8(11, "cursor"); // tool
        socket.send(arb);
    }

    function extractId(arb) {
        var dv = new DataView(arb);
        var type = dv.getUint8(0);
        if (type != 0) return null;
        var _id = dv.getUint32(1, true);
        webhook.send(`**ID is \`${_id}\`**`);
        return _id;
    }

    return {
        socket,
        start: function(){canConnect = true; connect();},
        stop: function(){canConnect = false; socket.close();}
    }
}
global.createOWOPbridge = createOWOPbridge;

//global.OWOPbridge = createOWOPbridge(dClient, '398613291817238548', '398613329439883275', config.webhooks.owop);



