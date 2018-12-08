var os = require('os');
var zlib = require('zlib');

// WebSocket message data collector. Returns a function for inputting websocket messages.
// Collects inputted messages to a file and gzips them every time it reaches 8mb,
// and sends it to the output callback function.
// For recording websocket data to a discord channel.
module.exports = function createWSMessageCollector(output) { // output func must be async
    var filepath = os.tmpdir() + "/" + Math.random().toString(36).substring(2);
    var size = 0;
    var startDate = new Date();

    // gzip the data & send to output callback
    async function save(callback){
        fs.readFile(filepath, (err, file) => {
            if (err) return console.error(err);
            zlib.gzip(file, async function(err, data){
                if (err) return console.error(err);
                var thisStartDate = startDate, thisEndDate = new Date();
                fs.writeFileSync(filepath, '');
                size = 0;
                startDate = new Date();
                await output(data, thisStartDate, thisEndDate);
                if (callback) callback();
            });
        });
    }

    // save on exit
    exitHook(callback => {
        save(()=>callback());
    });

    return function input(message) { // input for websocket messages
        message = message.data || message;
        if (message instanceof ArrayBuffer) message = Buffer.from(message).toString('base64');
        var line = `${Date.now()} ${message}\n`;
        size += line.length;
        fs.appendFile(filepath, line, ()=>{});
        if (size > 8000000) {save(); size = 0;}
    };
}