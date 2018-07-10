/*
 * These are the request handlers
 *
 */

// Dependencies
let _carts = require('./services/carts');
let _menu_items = require('./services/menu_items');
let _orders = require('./services/orders');
let _tokens = require('./services/tokens');
let _users = require('./services/users');


// Define the handlers
var handlers = {};

// Carts
handlers.carts = function(data,callback){
	if(_carts.acceptableMethods.indexOf(data.method) > -1){
		_carts[data.method](data,callback)
	} else {
		callback(405,{'Error':'Method not allowed!'});
	}	
}

// Menu Items
handlers.menu_items = function(data,callback){
	if(_menu_items.acceptableMethods.indexOf(data.method) > -1){
		_menu_items[data.method](data,callback)
	} else {
		callback(405,{'Error':'Method not allowed!'});
	}	
}

// Orders
handlers.orders = function(data,callback){
	if(_orders.acceptableMethods.indexOf(data.method) > -1){
		_orders[data.method](data,callback)
	} else {
		callback(405,{'Error':'Method not allowed!'});
	}	
}

// Tokens
handlers.tokens = function(data,callback){
	if(_tokens.acceptableMethods.indexOf(data.method) > -1){
		_tokens[data.method](data,callback)
	} else {
		callback(405,{'Error':'Method not allowed!'});
	}	
}

// Users
handlers.users = function(data,callback){
	if(_users.acceptableMethods.indexOf(data.method) > -1){
		_users[data.method](data,callback)
	} else {
		callback(405,{'Error':'Method not allowed!'});
	}
}

// Used to check to see if the server is alive
handlers.ping = function(data,callback){
	callback(200,{'Success':'API is up and running!'});
}

// Not found handler
handlers.notFound = function(data,callback){
	callback(404,{'Error':'Not a supported API Call!'});
};

module.exports = handlers;