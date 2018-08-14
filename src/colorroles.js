global.colorRoles = new Object();

colorRoles.findColorRole = function (member) { // get color role of member
	return member.roles.find(role => role.name.startsWith('['));
};

colorRoles.update = async function (member) { // create or remove member's color role based on presence
	if (member.guild.id != config.guildID) return;
	let existingColorRole = colorRoles.findColorRole(member);
	if (member.presence.status == "offline") { // they must not have the role
		if (!existingColorRole) return; // ok, they already don't have the role
		// save and delete their color role
		let role = existingColorRole;
		let dbrole = {
			id: role.id,
			name: role.name,
			color: role.color,
			hoist: role.hoist,
			position: role.position,
			permissions: role.permissions.bitfield,
			mentionable: role.mentionable
		};
		let id = member.id;
		// upsert member's color_role json
		let res = await dbClient.query(`SELECT * FROM member_data WHERE id = $1`, [id]);
		if (res.rows[0]) {
			await dbClient.query(`UPDATE member_data SET color_role = $2 WHERE id = $1`, [id, dbrole]);
		} else {
			await dbClient.query(`INSERT INTO member_data (id, color_role) VALUES ($1, $2)`, [id, dbrole]);
		}
		await role.delete();
	} else { // they must have their color role
		if (existingColorRole) return; // ok, they already have the role
		// give them their color role
		// check if database has their role
		let member_data = (await dbClient.query(`SELECT (color_role) FROM member_data WHERE id = $1`, [member.id])).rows[0];
		if (member_data && member_data.color_role) { // it does, reinstantiate it
			let dbrole = member_data.color_role;
			let role = member.guild.roles.get(dbrole.id); // get existing role if it still exists somehow
			if (!role) role = await member.guild.roles.create({data:{ // otherwise recreate it
				name: dbrole.name,
				color: dbrole.color,
				hoist: dbrole.hoist,
				//position: dbrole.position,
				permissions: dbrole.permissions,
				mentionable: dbrole.mentionable
			}});
			await member.roles.add(role);
		} else { // it doesn't, create a new one
			let role = await member.guild.roles.create({data:{
				name: "[]",
				permissions: [],
				color: "RANDOM",
			}});
			await member.roles.add(role);
		}   
	}
};

colorRoles.updateAll = async function() { // update all members' color roles
	var guild = dClient.defaultGuild || dClient.guilds.get(config.guildID);
	await guild.members.fetch(); // load all members
	for (let member of guild.members) {
		member = member[1];
		try {
			await colorRoles.update(member);
		} catch(e) {  //TODO debug
			console.error(e.stack);
		}
	}
};

colorRoles.pruneOrphanRoles = async function() { // delete all color roles that have no member
	var guild = dClient.defaultGuild || dClient.guilds.get(config.guildID);
	for (let role of guild.roles) {
		role = role[1];
		if (role.name.startsWith('[') && role.members.length == 0)
			await role.delete();
	}
};





// event listeners

dClient.on('presenceUpdate', async (oldPresence, newPresence) => { // update color role on presence update // emitted also on member join (iirc)
	//if (oldPresence && oldPresence.status == newPresence.status) return; // sometimes oldPresence.status getter throws an error
	colorRoles.update(newPresence.member);
});

dClient.on('guildMemberRemove', async member => { // update (delete) color role on member leave
	await colorRoles.update(member);
});





// commands

commands.color = {
	aliases: ["col"],
	usage: "<ColorResolvable>",
	description: "Changes your color",
	exec: async function (message) {
		var str = message.txt(1);
		if (!str) return false;
		var role = colorRoles.findColorRole(message.member);
		if (!role) {
			if (message.member.presence.status == "offline")
			   return message.reply([
					"You are offline.",
					"I can't change your color when you're invisible."
			   ].random());
			else {
				await colorRoles.update(message.member);
				role = colorRoles.findColorRole(message.member);
			}
		}
		/*if (!role) { // somehow this happened
			let a = 0;
			while (!(role = colorRoles.findColorRole(message.member)) && a++ < 10) {}
		}*/
		role.setColor(str.toUpperCase());
		message.react("🆗");
	}
}

commands.title = {
	aliases: ["tit"],
	usage: "<title>",
	description: "Sets your title (the name of your color role).\nUse “none” to clear your title.",
	exec: async function (message) {
		var str = message.txt(1);
		if (!str) return false;
		if (str == "none") str = "";
		if (str.length > 98) str = str.substr(0,97) + '…';
		var role = message.member.roles.find(role => role.name.startsWith('['));
		role.setName(`[${str}]`);
		message.react("🆗");
	}
}
