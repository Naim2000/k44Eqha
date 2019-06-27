const socketCluster = require("socketcluster-client")
const EventEmitter = require("events").EventEmitter;
const HttpsProxyAgent = require("https-proxy-agent");
const SocksProxyAgent = require("socks-proxy-agent");
class PRClient extends EventEmitter {
    constructor(credentials, options) {
        super()
        EventEmitter.call(this);
        this.options = options;
        this.socket;
        this.channels = {};
        this.credentials = credentials
    }
    connect() {
        if (!this.options) {
            this.options = {
                path: "/socketcluster/",
                hostname: "www.pianorhythm.me",
                port: 443,
                secure: true,
                autoReconnect: true,
            }
        }
        // Initiate the connection to the server
        this.socket = socketCluster.connect(this.options);
        this.socket.connect();
        this.socket.on("error", (msg) => {
            console.error(msg);
        })
        this.socket.on("connect", () => {
            console.log("Connected!")
            this.socket.emit("enableAuthLogin", {
                enable: true,
                roomName: this.credentials.roomName
            });
            this.socket.emit("enableCursor", {
                enable: true
            });
            this.socket.emit("login", {
                password: this.credentials.password,
                roomName: this.credentials.roomName,
                username: this.credentials.username
            });
            this.socket.emit("getPlayerStats", {
                "username": this.credentials.username
            })
        })
    }
}
module.exports = PRClient;