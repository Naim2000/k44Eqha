// join/leave
(async function(){
    var webhook = new Discord.WebhookClient(config.webhooks.welcome[0], config.webhooks.welcome[1]);
    dClient.on('local_guildMemberAdd', async member => {
        let username = member.user.username.toLowerCase().includes('clyde') ? member.user.username.replace(/C/g,'Q').replace(/c/g,'q') : member.user.username;
        webhook.send(`${member} joined.`, {username, avatarURL: member.user.displayAvatarURL({format:'png',size:2048}), disableMentions:'all'});
    });
    dClient.on('local_guildMemberRemove', async member => {
        let username = member.user.username.toLowerCase().includes('clyde') ? member.user.username.replace(/C/g,'Q').replace(/c/g,'q') : member.user.username;
        webhook.send(`${member.user.tag} left.`, {username, avatarURL: member.user.displayAvatarURL({format:'png',size:2048}), disableMentions:'all'});
    });
})();


// view deleted channels
(async function(){
    var vcid = config.channels.view_deleted_channels;
    var rid = config.roles.viewing_deleted_channels;
    dClient.on('local_voiceStateUpdate', async (oldState, newState) => {
        if (oldState.channelID != vcid && newState.channelID == vcid) {
            // member joined the channel
            newState.member.roles.add(newState.member.guild.roles.resolve(rid));
        } else if (oldState.channelID == vcid && newState.channelID != vcid) {
            // member left the channel
            newState.member.roles.remove(newState.member.guild.roles.resolve(rid));
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
    dClient.on("local_guildMemberUpdate", async (oldMember, newMember) => {
        if (oldMember.displayName != newMember.displayName) onName(newMember);
    });
}*/// didn't work D:


/*// arrange bots at bottom of list
(async function(){
    let prefix = "\udb40\uddf0";//TODO find new chars that aren't filtered
    let onNick = async member => {
    if (member.user.bot && !member.displayName.startsWith(prefix))
        await member.setNickname(`${prefix}${member.displayName}`.substr(0,32));
    };
    dClient.on('local_guildMemberAdd', onNick);
    dClient.on('local_guildMemberUpdate', async (oldMember, newMember) => {
        if (newMember.displayName != oldMember.displayName) await onNick(newMember);
    });
})();*/


// prevent identical display names
/*(async function(){
    dClient.on("local_guildMemberUpdate", async (oldMember, newMember) => {
        //var displayNames = newMember.guild.members.map(m => m.displayName);
        //if (newMember.nickname && displayNames.includes(newMember.nickname)) newMember.setNickname('');
        //else if (displayNames.includes(newMember.displayName)) newMember.setNickname(`${newMember.displayName}_`.substr(0,32));
        for (let thisMember of newMember.guild.members) {
            thisMember = thisMember[1];
            if (thisMember.id == newMember.id) continue; //THIS WAS SUPPOSED TO MAKE IT NOT REPEATEDLY CHANGE YOUR NAME!
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
})();*/


// persistent emojis
dClient.on("local_emojiDelete", async emoji => {
    console.log("emoji deleted:", emoji.name, emoji.url);
    if (global.disableEmojiProtection) return;
    if (emoji.name.toLowerCase().includes('delete')) return;
    async function readdEmoji() {
        await emoji.guild.emojis.create(emoji.url, emoji.name);
        delete readdEmoji;
    }
    // re-add emoji in 5 to 10 minutes
    setTimeout(() => {
        if (readdEmoji) readdEmoji();
    }, 300000 + Math.random() * 300000);
    // wouldn't want emoji to be lost if process is stopped before timeout ends
    exitHook(callback => {
        if (readdEmoji) readdEmoji().then(() => callback());
        else callback();
    });
});


// pinboard // this was removed but no harm leaving it working ¯\_(ツ)_/¯
(async function(){
    var webhook = new Discord.WebhookClient(config.webhooks.pinboard[0], config.webhooks.pinboard[1]);
    dClient.on("local_messageReactionAdd", async (messageReaction, user) => {
        if (!(messageReaction.emoji.name == "📌" || messageReaction.emoji.name == "📍")) return;
        if (!(user.id == messageReaction.message.author.id || messageReaction.message.guild.members.resolve(user.id).hasPermission('MANAGE_MESSAGES'))) return;// if message is theirs or user is mod
        var message = messageReaction.message;
        await webhook.send(`https://discordapp.com/channels/${message.guild.id}/${message.channel.id}/${message.id}`, {embeds:[{
            color: (message.member && message.member.displayColor) || undefined,
            author: {
                name: (message.member && message.member.displayName) || message.author.username,
                icon_url: message.author.avatarURL({format:'png'})
            },
            description: message.content,
            timestamp: message.createdAt,
            image: (message.attachments.first() && message.attachments.first().width) ? {url:message.attachments.first().url} : undefined,
            footer: {
                text: `#${message.channel.name}`
            }
        }]});
    });
})();


// allow anyone to pin a message via reaction
dClient.on("local_messageReactionAdd", async (messageReaction) => {
    if (messageReaction.emoji.name == "📌" || messageReaction.emoji.name == "📍")
        await messageReaction.message.pin();
});










