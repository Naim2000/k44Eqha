const PRClient = require("./PRClient.js");
evalcmd();
const Discord = require("discord.js");
const dclient = new Discord.Client();
dclient.login("no u");
dclient.on('ready', () => {
    let client = new PRClient({// account stuff
        username: "Discord",
        password: "vWmnsEkgAPcU3VR",
        roomName: 'lobby'
    });
    client.connect();
    client.socket.on("setRoom", function (data, callback) {
        client.roomID = data.roomID;
        try {
            if (client.channels.chatChannel && client.roomID) {
                client.socket.destroyChannel(client.roomID);
            }
        } catch (err) {}
        client.channels.chatChannel = client.socket.subscribe(data.roomID);
        client.channels.chatChannel.watch(messagehandle);
    })
})

function messagehandle(data) {
    if (data && data.type) {
        switch (data.type) {
            case "chat":
                if (data && data.message) {
                    let name = data.name || "";
                    let effect = data.effect || "";
                    let roomName = data.roomName;
                    let color = data.color;
                    let id = data.id;
                    if (data.notify)
                        console.log("NOTIFY: " + data.message);

                    console.log(`${name}: ${data.message}`);
                    dclient.channels.get("380431177812803584").send(`${name}: ${data.message}`);
                }
                break;
        }
    }
}

function evalcmd() {
    //with all optional parameters set to opposite of default
    const {
        EntoliPrompt
    } = require('entoli');
    let EP = new EntoliPrompt('', {
        enterMessage: false,
        exitMessage: false,
        preventExit: false
    });
    EP().then((a) => {
        client.socket.publish("fcf6e7e5-1d9a-48ee-808f-a9b626ce090b", {
            "type": "chat",
            "message": a.toString(),
            "value": false,
            "socketID": "󠀀[discord.gg/k44Eqha]",
            "uuid": "󠀀[discord.gg/k44Eqha]",
            "color": "#8012ed",
            "name": "󠀀[discord.gg/k44Eqha]"
        })
        evalcmd();
    }).catch((e) => {
        console.error(e);
        evalcmd();
    });
}