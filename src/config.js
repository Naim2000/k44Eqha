global.testmode = process.env.TEST ? true : false;

module.exports = {
    
    "DISCORD_TOKEN": process.env.DISCORD_TOKEN,
    "DATABASE_URL": testmode ? "postgres://localhost/k4t" : process.env.DATABASE_URL,
    "MONGODB_URI": testmode ? "mongodb://localhost/k4t" : process.env.MONGODB_URI,

	"webhooks": {
        "welcome": process.env.WEBHOOK_WELCOME.split("/"),
        "error": process.env.WEBHOOK_ERROR.split("/")
	},
	
    "opID": "281134216115257344",
    "guildID": testmode ? "467473467634089985" : "321819041348190249",

    "channels": { // includes voice channels & category channels
        "main": testmode ? "467473467634089987" : "321819041348190249",
        "view_deleted_channels": testmode ? "467473467634089989" : "425060452129701889",
        "name_collection": testmode ? "467481952728121345" : '379738469511069698',
        "mpp_bridges": testmode ? "467481904707534850" : '360557444952227851',
        "user_channels": testmode ? "467482031157149709" : '399735134061985792',
        "deleted_channels": testmode ? "467482085657935872" : '425054198699261953',
        "deleted_bridges": testmode ? "467482121657778176" : '451838300068511745',
        "mpp_screenshot": testmode ? "467482164611514388" : '383773548810076163',
        "owop_screenshot": testmode ? "467482202217906226" : '399079481161023492'
    },

    "roles": {
        "viewing_deleted_channels": testmode ? "467473718353068042" : "425060792455397376",
    },


    
    "mppname": "[discord.gg/k44Eqha]",
    "disabledRooms": [
        "RP Room",
        "Legends of Alorgon {RP Room}",
        "Legends of Alorgon",
        "Breastmilk ♥ 7:45 AM"
    ],

}