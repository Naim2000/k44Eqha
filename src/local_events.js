dClient.on("guildMemberAdd", function(member){
    if (member.guild.id == config.guildID)
        this.emit("local_guildMemberAdd", member);
});
dClient.on("guildMemberRemove", function(member){
    if (member.guild.id == config.guildID)
        this.emit("local_guildMemberRemove", member);
});
dClient.on("guildMemberUpdate", function(oldMember, newMember){
    if (newMember.guild.id == config.guildID)
        this.emit("local_guildMemberUpdate", oldMember, newMember);
});
dClient.on("message", function(message){
    if (message.guild.id == config.guildID)
        this.emit("local_message", message);
});
dClient.on("presenceUpdate", function(oldPresence, newPresence){
    if (newPresence.member && newPresence.member.guild.id == config.guildID)
        this.emit("local_presenceUpdate", oldPresence, newPresence);
});
dClient.on("voiceStateUpdate", function(oldState, newState){
    if (newState.guild.id == config.guildID)
        this.emit("local_voiceStateUpdate", oldState, newState);
});