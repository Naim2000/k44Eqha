global.screenshotter = {
	capture: async function () {
		console.log('Starting screen captures');
		try {
			var puppeteer = require('puppeteer');
			var browser = await puppeteer.launch({ args: ['--no-sandbox'] });
			var page = await browser.newPage();
			await page.setViewport({ width: 1440, height: 900 });
			try {
				await page.goto('http://www.multiplayerpiano.com/lobby');
				await page.evaluate(function () { document.getElementById('modal').click() });
				await new Promise(resolve => setTimeout(resolve, 5000));
				let screenshot = await page.screenshot({ type: 'png' });
				let filename = `Screenshot of www.multiplayerpiano.com/lobby @ ${new Date().toISOString()}.png`;
				let attachment = new Discord.MessageAttachment(screenshot, filename);
				await dClient.channels.get(config.channels.mpp_screenshot).send(attachment);
			} catch (error) {
				await dClient.channels.get(config.channels.mpp_screenshot).send(`:warning: ${error.stack}`);
			}
			try {
				await page.goto('http://ourworldofpixels.com');
				await page.evaluate(function () {
					localStorage.owopcaptcha = require('./config').owop_captcha_password;
					OWOP.camera.zoom = 1;
				});
				await new Promise(resolve => setTimeout(resolve, 2000));
				await page.evaluate(function () {
					for (let butt of document.getElementsByTagName('button')) {
						if (butt.innerText == 'OK') {butt.click();break}
					}
				});
				await new Promise(resolve => setTimeout(resolve, 5000));
				let screenshot = await page.screenshot({ type: 'png' });
				let filename = `Screenshot of ourworldofpixels.com/main @ ${new Date().toISOString()}.png`;
				let attachment = new Discord.MessageAttachment(screenshot, filename);
				await dClient.channels.get(config.channels.owop_screenshot).send(attachment);
			} catch (error) {
				await dClient.channels.get(config.channels.owop_screenshot).send(attachment);
			}
		} catch(error) {
			console.error(`Error occured with screen capture:\n${error.stack}`)
		} finally {
			await browser.close();
			console.log('Finished screen captures');
		}
	},
	interval: setInterval(() => { screenshotter.capture(); }, 1000 * 60 * 60)
};
