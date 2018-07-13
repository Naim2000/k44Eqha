

// join/leave
(async function(){
    var webhook = new Discord.WebhookClient(config.webhooks.welcome[0], config.webhooks.welcome[1]);
    dClient.on('guildMemberAdd', async member => {
        webhook.send(`${member} joined.`, {username: member.user.username, avatarURL: member.user.displayAvatarURL(), disableEveryone:true});
    });
    dClient.on('guildMemberRemove', async member => {
        webhook.send(`${member.user.tag} left.`, {username: member.user.username, avatarURL: member.user.displayAvatarURL(), disableEveryone:true});
    });
})();


// view deleted channels
(async function(){
    var vcid = '425060452129701889';
    var rid = '425060792455397376';
    dClient.on('voiceStateUpdate', async (oldMember, newMember) => {
        if (oldMember.voiceChannelID != vcid && newMember.voiceChannelID == vcid) {
            // member joined the channel
            newMember.roles.add(newMember.guild.roles.get(rid));
        } else if (oldMember.voiceChannelID == vcid && newMember.voiceChannelID != vcid) {
            // member left the channel
            newMember.roles.remove(newMember.guild.roles.get(rid));
        }
    });
})();