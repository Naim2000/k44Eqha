
Array.prototype.random = function () {
    return this[Math.floor(Math.random() * this.length)]
}

global.sanitizeName = function sanitizeName(str){ // for showing names in discord
	str = str.replace(/[_~*\\]/g,"\\$&"); // formatting
	str = escapeDiscordMentions(str); // mentions
    str = str.replace(/discord.gg\//g, 'discord.gg\\/'); // invites
    str = str.replace(/(http|https):\/\//g, "$1\\://"); // urls
	return str;
}

global.escapeDiscordMentions = function escapeDiscordMentions(str) { // escape discord mentions from a string to be sent to discord
    str = str.replace(/<@/g, "<\\@"); // users & roles
    // escaping channel mentions is not necessary
    return str;
}