module.exports = {

    "testmode": new Boolean(process.env.TEST),
    
    "DISCORD_TOKEN": process.env.DISCORD_TOKEN,
    "DATABASE_URL": this.testmode ? "postgres://localhost/k4t" : process.env.DATABASE_URL,
    "MONGODB_URI": this.testmode ? "mongodb://localhost/k4t" : process.env.MONGODB_URI,

	"webhooks": {
		"welcome": process.env.WEBHOOK_WELCOME.split("/"),
	},
	
    "opID": "281134216115257344",
    "guildID": this.testmode ? "467473467634089985" : "321819041348190249",

    "channels": { // includes voice channels & category channels
        "main": this.testmode ? "467473467634089987" : "321819041348190249",
        "voice": this.testmode ? "467473467634089989" : "425060452129701889",
        "name_collection": this.testmode ? "" : '379738469511069698',
        "mpp_bridges": this.testmode ? "" : '360557444952227851',
        "user_channels": this.testmode ? "" : '399735134061985792',
        "deleted_channels": this.testmode ? "" : '425054198699261953',
        "deleted_bridges": this.testmode ? "" : '451838300068511745',
        "mpp_screenshot": this.testmode ? "" : '383773548810076163',
        "owop_screenshot": this.testmode ? "" : '399079481161023492'
    },

    "roles": {
        "viewing_deleted_channels": this.testmode ? "467473718353068042" : "425060792455397376",
    },


    
    "mppname": "[discord.gg/k44Eqha]",
    "disabledRooms": [
        "RP Room",
        "Legends of Alorgon {RP Room}",
        "Legends of Alorgon",
        "Breastmilk ♥ 7:45 AM"
    ],

}