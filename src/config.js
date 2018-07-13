module.exports = {

    "testmode": new Boolean(process.env.TEST),

    "token": process.env.DISCORD_TOKEN,
	
	"webhooks": {
		"console": process.env.WEBHOOK_CONSOLE.split("/"),
		"welcome": process.env.WEBHOOK_WELCOME.split("/"),
	},
	
    "opID": "281134216115257344",
    "guildID": this.testmode ? "" : "321819041348190249",
    "channels": {
        "main": this.testmode ? "" : "321819041348190249"
    },


    
    "mppname": "[discord.gg/k44Eqha]",
    "disabledRooms": [
        "RP Room",
        "Legends of Alorgon {RP Room}",
        "Legends of Alorgon",
        "Breastmilk ♥ 7:45 AM"
    ],

}