module.exports = async function(gClient, site, room, DiscordChannel) {
    var path = require('os').tmpdir();
    var filename = `${site} ${room} .txt`.replace(/\//g, ':');
    var filepath = path + "/" + filename;
    var size = 0;
    var startDate = new Date();
    gClient.on('message', function(msg){
        var data = msg.data;
        if (data instanceof ArrayBuffer) data = Buffer.from(data).toString('base64');
        var line = `${Date.now()} ${data}\n`;
        size += line.length;
        fs.appendFile(filepath, line, ()=>{});
        if (size > 8000000) {save(); size = 0;}
    });
    async function save(callback){
        console.log(`saving data recording`, filename)
        fs.readFile(filepath, (err, file) => {
            if (err) return console.error(err);
            require('zlib').gzip(file, async function(err, gzip){
                if (err) return console.error(err);
                var attachmentName = `${site} ${room} raw data recording from ${startDate.toISOString()} to ${new Date().toISOString()} .txt.gz`;
                await DiscordChannel.send(new Discord.MessageAttachment(gzip, attachmentName));
                fs.writeFileSync(filepath, '');
                size = 0;
                startDate = new Date();
                console.log(`saved raw data recording`, attachmentName);
                if (callback) callback();
            });
        });
    }
    exitHook(callback => {
        save(()=>callback());
    });
    gClient.dataCollectorSave = function(){save()}; // test
}