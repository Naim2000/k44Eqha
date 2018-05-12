

global.colorRoles = {
    create: async function (member){
        var role = await member.guild.createRole({data:{
            name:"[]",
            permissions:[],
            color:"RANDOM",
            //position: member.guild.roles.get('346754988023873546').position
        }});
        member.addRole(role);
        return role;
    },
    get: function (member){
        return member.roles.find(role => {if (role.name.startsWith('[')) return role});
    },
    ensure: function (member) { // give color role to member if they don't have one; not sure what to call this
        if (this.get(member)) return;
        this.create(member);
    },
}


dClient.on('presenceUpdate', (oldMember, newMember) => {
    if (newMember.guild.id != config.guildID) return;
    if (oldMember.presence.status != newMember.presence.status && newMember.presence.status != "offline") {
        colorRoles.ensure(newMember);
    }
});
//dClient.on('guildMemberAdd', member => colorRoles.ensure(member));
dClient.on('guildMemberRemove', member => {
    if (member.guild.id != config.guildID) return;
    var role = colorRoles.get(member);
    if (role.members.array().length == 0) role.delete();
});

commands.color = {
    aliases: ["col"],
    usage: "<ColorResolvable>",
    description: "Changes your color",
    exec: async function (message) {
        var str = message.txt(1);
        if (!str) return false;
        var role = colorRoles.get(message.member);
        role.setColor(str.toUpperCase());
        message.react("🆗");
    }
}

commands.title = {
    aliases: ["tit"],
    usage: "<title>",
    description: "Sets your title (the name of your personal role).\nUse “none” to clear your title.",
    exec: async function (message) {
        var str = message.txt(1);
        if (!str) return false;
        if (str == "none") str = "";
        if (str.length > 98) str = str.substr(0,97) + '…';
        var role = colorRoles.get(message.member);
        role.setName(`[${str}]`);
        message.react("🆗");
    }
}
