

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

// prevent identical display names
/*{
    let onName = async function(member){
        let names = member.guild.members.map(m => m.name);
        if (names.includes(member.displayName)) {
            let nam = member.displayName.split(' ');
            let num = nam.pop();
            if (isNaN(num)) {
                nam.push(num);
                num = "2";
            } else {
                num = String(++num);
            }
            nam = nam.substr(0, num.length-1);
            await member.setNickname(`${nam} ${num}`);
        }
    }
    dClient.on("guildMemberUpdate", async (oldMember, newMember) => {
        if (oldMember.displayName != newMember.displayName) onName(newMember);
    });
}*/// didn't work D:


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


// prevent identical display names
(async function(){
    dClient.on("guildMemberUpdate", async (oldMember, newMember) => {
        /*var displayNames = newMember.guild.members.map(m => m.displayName);
        if (newMember.nickname && displayNames.includes(newMember.nickname)) newMember.setNickname('');
        else if (displayNames.includes(newMember.displayName)) newMember.setNickname(`${newMember.displayName}_`.substr(0,32));*/
        for (let thisMember of newMember.guild.members) {
            thisMember = thisMember[1];
            if (thisMember.id == newMember.id) continue;
            if (newMember.nickname == thisMember.displayName) {
                newMember.setNickname('');
                break;
            }
            else if (newMember.displayName == thisMember.displayName) {
                newMember.setNickname(`${newMember.displayName}_`.substr(0,32));
                break;
            }
        }
    });
})();
