/*
 * These are the routes
 *
 */

// Dependencies
let handlers = require('./handlers');

// Container
let routers = {
	'notFound' 		: handlers.notFound,
	'ping' 			: handlers.ping,
	'carts' 		: handlers.carts,
	'menu_items' 	: handlers.menu_items,
	'orders' 		: handlers.orders,
	'tokens' 		: handlers.tokens,
	'users' 		: handlers.users
};


// Return module
module.exports = routers;