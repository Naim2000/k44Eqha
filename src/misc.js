

// join/leave
(function(){
    var webhook = new Discord.WebhookClient('404736784354770958', config.webhooks.welcome);
    dClient.on('guildMemberAdd', member => {
        webhook.send(`${member} joined.`, {username: member.user.username, avatarURL: member.user.displayAvatarURL(), disableEveryone:true});
    });
    dClient.on('guildMemberRemove', member => {
        webhook.send(`${member.user.tag} left.`, {username: member.user.username, avatarURL: member.user.displayAvatarURL(), disableEveryone:true});
    });
})();


// view deleted channels
(function(){
    var vcid = '425060452129701889';
    var rid = '425060792455397376';
    dClient.on('voiceStateUpdate', (oldMember, newMember) => {
        if (oldMember.voiceChannelID != vcid && newMember.voiceChannelID == vcid) {
            // member joined the channel
            newMember.addRole(newMember.guild.roles.get(rid));
        } else if (oldMember.voiceChannelID == vcid && newMember.voiceChannelID != vcid) {
            // member left the channel
            newMember.removeRole(newMember.guild.roles.get(rid));
        }
    });
})();