process.on('unhandledRejection', (reason, promise) => {
	console.error(promise);
});
process.on('uncaughtException', error => {
	console.error(error.stack);
});

Array.prototype.random = function () {
    return this[Math.floor(Math.random() * this.length)]
}