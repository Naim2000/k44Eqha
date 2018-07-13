module.exports = async function(gClient, site, room, DiscordChannel) {
    var filename = `${site} ${room} .txt`.replace(/\//g, ':');
    var size = 0;
    var startDate = new Date();
    gClient.on('ws created', function(){
        gClient.ws.addEventListener('message', msg => {
            var data = msg.data;
            if (data instanceof ArrayBuffer) data = Buffer.from(data).toString('base64');
            var line = `${Date.now()} ${data}\n`;
            size += line.length;
            fs.appendFile(filename, line, ()=>{});
            if (size > 8000000) {save(); size = 0;}
        });
    });
    async function save(callback){
        console.log(`saving data recording`, filename)
        fs.readFile(filename, (err, file) => {
            if (err) return console.error(err);
            require('zlib').gzip(file, async function(err, gzip){
                if (err) return console.error(err);
                var attachmentName = `${site} ${room} raw data recording from ${startDate.toISOString()} to ${new Date().toISOString()} .txt.gz`;
                await DiscordChannel.send(new Discord.MessageAttachment(gzip, attachmentName));
                fs.writeFileSync(filename, '');
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