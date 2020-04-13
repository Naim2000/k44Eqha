
global.random = function (array) {
    return array[Math.floor(Math.random() * array.length)]
}

global.sanitizeName = function sanitizeName(str){ // for showing names in discord
	str = str.replace(/[_~*\\]/g,"\\$&"); // formatting
	str = escapeDiscordMentions(str); // mentions
    str = str.replace(/discord.gg\//g, 'discord.gg\\/'); // invites // discordapp.com/api/invite/ ? was it that? idk something like that but it also works
    str = str.replace(/(http|https):\/\//g, "$1\\://"); // urls
	return str;
}

global.escapeDiscordMentions = function escapeDiscordMentions(str) { // escape discord mentions from a string to be sent to discord
    str = str.replace(/<@/g, "<\\@"); // users & roles
    // escaping channel mentions is not necessary
    return str;
}