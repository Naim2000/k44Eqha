global.screenshotter = {    
    capture: async function () {
        console.log('Starting screen captures');
        var puppeteer = require('puppeteer');
        var browser = await puppeteer.launch({args:['--no-sandbox']});
        var page = await browser.newPage();
        await page.setViewport({width: 1440, height: 900});
        await page.goto('http://www.multiplayerpiano.com/lobby');
		await new Promise(resolve => setTimeout(resolve, 5000));
        var screenshot = await page.screenshot({type: 'png'});
        var filename = `Screenshot of www.multiplayerpiano.com/lobby @ ${new Date().toISOString()}.png`;
        var attachment = new Discord.MessageAttachment(screenshot, filename);
		await dClient.channels.get('383773548810076163').send(attachment);
		await page.goto('http://ourworldofpixels.com');
		await page.evaluate(function(){OWOP.camera.zoom = 1;});
		await new Promise(resolve => setTimeout(resolve, 5000));
		var screenshot = await page.screenshot({type: 'png'});
		var filename = `Screenshot of ourworldofpixels.com/main @ ${new Date().toISOString()}.png`;
		var attachment = new Discord.MessageAttachment(screenshot, filename);
		await dClient.channels.get('399079481161023492').send(attachment);
		await browser.close();
        console.log('Finished screen captures');
    },
    interval: setInterval(()=>{screenshotter.capture();}, 1000*60*60)
};