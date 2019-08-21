global.colorRoles = new Object();

colorRoles.findColorRole = function (member) { // get color role of member
	return member.roles.find(role => role.name.startsWith('['));
};

colorRoles.update = async function (member) { // create or remove member's color role based on presence
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
    console.log("Updating all color roles");
	var guild = dClient.defaultGuild || dClient.guilds.get(config.guildID);
	await guild.members.fetch(); // load all members
	for (let member of guild.members) {
		member = member[1];
		try {
			await colorRoles.update(member);
			console.log("Updated", member.user.tag);
		} catch(e) {
			console.error(e.stack);
		}
	}
	console.log("Finished updating all color roles");
};

colorRoles.pruneOrphanRoles = async function() { // delete all color roles that have no member
    console.log("Pruning orphan roles");
	var guild = dClient.defaultGuild || dClient.guilds.get(config.guildID);
	for (let role of guild.roles) {
		role = role[1];
		if (role.name.startsWith('[') && !role.members.size) {
			try {
				await role.delete();
				console.log("Deleted role ", role.id, role.name, role.color, role.permissions);
			} catch (e) {
				console.error(e);
			}
		}
	}
	console.log("Finished pruning orphan roles");
};





// event listeners

/*
dClient.on('local_presenceUpdate', async (oldPresence, newPresence) => {
	//if (oldPresence && (oldPresence.status == newPresence.status)) return; // don't constantly add/remove roles anymore
	// add role when person goes online
	if (newPresence.status != "offline")
		await colorRoles.update(newPresence.member);
	// and do not remove until we run out of roles
});

dClient.on('local_guildMemberRemove', async member => { // update (delete) color role on member leave
	await colorRoles.update(member);
});

{
	let lastRoleMaintenance;
	dClient.on('error', async (error) => {
		if (Date.now() - lastRoleMaintenance < 600000) return; // in case errors are spammed, don't try running maintenance if it was already done within 10 mins ago
		lastRoleMaintenance = Date.now();
		if (error.message == "Maximum number of guild roles reached (250)") {
			console.log("Ran out of roles; running maintenance");
			await colorRoles.updateAll(); // remove roles from offline users when we run out of roles
			await colorRoles.pruneOrphanRoles(); // remove any roles whose member doesn't exist anymore
		}
	});
}
*/






// commands

commands.color = {
	aliases: ["col", "colour"],
	usage: "<ColorResolvable>",
	description: "Changes your color, or the color of your role. You can use a hex code or one of the color names listed [here](https://discord.js.org/#/docs/main/master/typedef/ColorResolvable), but not RGB arrays. Color names are not case sensitive. Invalid colors will make you colorless. You cannot change your color if you are offline or invisible.",
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
		await role.setColor(str.toUpperCase());
		await message.react("🆗");
	}
}

commands.title = {
	aliases: ["tit"],
	usage: "<title>",
	description: "Sets your title, or the name of your colored role. Titles longer than 98 chars will be truncated. You cannot change your title if you are invisible.\nUse “none” to clear your title.",
	exec: async function (message) {
		var str = message.txt(1);
		if (!str) return false;
		if (str == "none") str = "";
		if (str.length > 98) str = str.substr(0,97) + '…';
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
		await role.setName(`[${str}]`);
		await message.react("🆗");
	}
}
