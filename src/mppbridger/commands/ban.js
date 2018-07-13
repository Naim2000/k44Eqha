module.exports = {
    usage: "<MPP user id>",
    description: "Adds a perma-ban on the user",
    aliases: ["permaban"],
    exec: async function (msg) {
        if (!msg.args[1]) return "EBADUSG";
        var res = await dbClient.query('SELECT * FROM bridges WHERE discord_channel_id = $1;', [msg.channel.id]);
        if (!res.rows.length) return "ENOTBRIDGE"
        var bridge = res.rows[0];
        if (bridge.owner_discord_user_id != msg.author.id) return msg.reply(`You are not the owner of this bridge.`);
        var _id = msg.txt(1);
        await dbClient.query("UPDATE bridges SET bans = bans || $1 WHERE discord_channel_id = $2", [_id, msg.channel.id]);
        await msg.reply(`OK, I'll ban anyone whose user ID equals or starts with \`${_id}\` from this room, whenever possible.`);

        var client = clients.MPP[bridge.mpp_room]
        for (let p in client.ppl) {
            p = client.ppl[p]
            if (p._id.startsWith(_id)) 
                client.sendArray([{m:'kickban', _id, ms: 60*60*1000}])
        }

        if (_id.length != 24) await msg.reply(":warning: The ID you gave me does not look like a full user ID (it is not 24 chars long). If it's a truncated ID it will still work, however it could possibly ban someone else whose user ID starts with those chars.")

    },
}