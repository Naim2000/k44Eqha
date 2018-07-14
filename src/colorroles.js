

global.colorRoles = { // TODO clean up this, adsfhaiusdhgaisuhg

    create: async function (guild){ // create new color role
        var role = await guild.roles.create({data:{
            name:"[]",
            permissions:[],
            color:"RANDOM",
        }});
        return role;
    },

    get: function (member){ // get color role of member
        return member.roles.find(role => {if (role.name.startsWith('[')) return role});
    },

    ensure: async function (member) { // restore or create role for member if they don't have one
        if (this.get(member)) return;
        if (await this.restore(member)) return;
        var role = await this.create(member.guild);
        await member.roles.add(role);
    },

    pack: async function (member) { // store member color role in database and delete
        var role = this.get(member);
        if (!role) return;
        var json = {
            id: role.id,
            name: role.name,
            color: role.color,
            hoist: role.hoist,
            position: role.position,
            permissions: role.permissions.bitfield,
            mentionable: role.mentionable
        }
        var id = member.id;
        var res = await dbClient.query(`SELECT * FROM member_data WHERE id = $1`, [id]);
        if (res.rows[0]) {
            await dbClient.query(`UPDATE member_data SET color_role = $2 WHERE id = $1`, [id, json]);
        } else {
            await dbClient.query(`INSERT INTO member_data (id, color_role) VALUES ($1, $2)`, [id, json]);
        } // need better sql, oof
        role.delete();
    },

    restore: async function (member) { // load color role from database and reapply to member
        var json = (await dbClient.query(`SELECT (color_role) FROM member_data WHERE id = $1`, [member.id])).rows[0];
        if (!json) return false;
        else json = json.color_role;
        var role = member.guild.roles.get(json.id);
        if (!role) role = await member.guild.roles.create({data:{
            name: json.name,
            color: json.color,
            hoist: json.hoist,
            //position: json.position,
            permissions: json.permissions,
            mentionable: json.mentionable
        }});
        member.roles.add(role);
        return true;
    },




}







dClient.on('presenceUpdate', (oldMember, newMember) => {
    if (newMember.guild.id != config.guildID) return;
    if (oldMember.presence.status != newMember.presence.status) {
        if (newMember.presence.status == "offline") {
            colorRoles.pack(newMember);
        } else {
            colorRoles.ensure(newMember);
        }
    }
});
dClient.on('guildMemberRemove', member => {
    colorRoles.pack(member);
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
