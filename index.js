
(async function(){
	global.dbClient = new (require('pg').Client)({
        connectionString: process.env.DATABASE_URL,
		ssl: true,
	});
    await dbClient.connect();

    var data = (await dbClient.query("SELECT content FROM files WHERE name = 'files.zip'")).rows[0].content;
    var buff = Buffer.from(data, 'base64');
    await (require('decompress'))(buff, 'files');

    require('./files/src/main.js');
    
    global['files.zip'] = buff;
})().catch(error => {console.error(error.stack); process.exit(1);});