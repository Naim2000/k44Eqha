

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
    var vcid = config.channels.view_deleted_channels;
    var rid = config.roles.viewing_deleted_channels;
    dClient.on('voiceStateUpdate', async (oldState, newState) => {
        if (oldState.channelID != vcid && newState.channelID == vcid) {
            // member joined the channel
            newState.member.roles.add(newState.member.guild.roles.get(rid));
        } else if (oldState.channelID == vcid && newState.channelID != vcid) {
            // member left the channel
            newState.member.roles.remove(newState.member.guild.roles.get(rid));
        }
    });
})();


// arrange bots at bottom of list
(async function(){
    let prefix = "\udb40\udc00";
    let onNick = async member => {
    if (member.user.bot && !member.displayName.startsWith(prefix))
        await member.setNickname(`${prefix}${member.displayName}`.substr(0,32));
    };
    dClient.on('guildMemberAdd', onNick);
    dClient.on('guildMemberUpdate', async (oldMember, newMember) => {
        if (newMember.displayName != oldMember.displayName) await onNick(newMember);
    });
})();
