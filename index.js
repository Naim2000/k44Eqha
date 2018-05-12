(async function(){
	global.dbClient = new (require('pg').Client)({
        connectionString: process.env.DATABASE_URL,
		ssl: true,
	});
    await dbClient.connect();

    require('./src/main');
    
})().catch(error => {console.error(error.stack); process.exit(1);});