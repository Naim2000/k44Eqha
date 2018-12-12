dClient.on("guildMemberAdd", async function(member){
    if (member.guild.id == config.guildID)
        this.emit("local_guildMemberAdd", member);
});
dClient.on("guildMemberRemove", async function(member){
    if (member.guild.id == config.guildID)
        this.emit("local_guildMemberRemove", member);
});
dClient.on("guildMemberUpdate", async function(oldMember, newMember){
    if (newMember.guild.id == config.guildID)
        this.emit("local_guildMemberUpdate", oldMember, newMember);
});
dClient.on("message", async function(message){
    if (message.guild && message.guild.id == config.guildID)
        this.emit("local_message", message);
});
dClient.on("presenceUpdate", async function(oldPresence, newPresence){
    if (newPresence.member && newPresence.member.guild.id == config.guildID)
        this.emit("local_presenceUpdate", oldPresence, newPresence);
});
dClient.on("voiceStateUpdate", async function(oldState, newState){
    if (newState.guild.id == config.guildID)
        this.emit("local_voiceStateUpdate", oldState, newState);
});
dClient.on("emojiDelete", async function(emoji){
    if (emoji.guild.id == config.guildID)
        this.emit("local_emojiDelete", emoji);
});