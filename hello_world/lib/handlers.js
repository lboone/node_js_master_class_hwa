/*
 * These are the request handlers
 *
 */

// Dependencies
let _hello = require('./services/hello');


// Define the handlers
var handlers = {};

// Users
handlers.hello = function(data,callback){
	if(_hello.acceptableMethods.indexOf(data.method) > -1){
		_hello[data.method](data,callback)
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