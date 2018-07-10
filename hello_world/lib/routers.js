/*
 * These are the routes
 *
 */

// Dependencies
let handlers = require('./handlers');

// Container
let routers = {
	'notFound' : handlers.notFound,
	'ping' : handlers.ping,
	'hello' : handlers.hello
};

// Return module
module.exports = routers;