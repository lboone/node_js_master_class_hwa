/*
 * These are the request handlers
 *
 */

// Dependencies
let _data = require('./../data');
let helpers = require('./../helpers');
let tokens = require('./tokens');

// Container for the user submethods
menu_items = {};

menu_items.acceptableMethods = ['post','get','put','delete'];

// Menu Items - post
// Required data: name, cost, size
// Optional data: none
menu_items.post = function(data,callback){
	//Token needed to post menu items && AuthID
};

// Menu Items - get
// Required data: id
// Optional data: none
menu_items.get = function(data,callback){
	// Check that the phone number provided is valid
	var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == config.defaultTokenStringLength ? data.queryStringObject.id.trim() : false;
	if(id){
		// Get the token from the headers
		var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

		// Verify that the given token from the headers is valid for the phone number
		tokens.verifyToken(token,phone,function(tokenIsValid){
			if(tokenIsValid){
				// Lookup the user
				_data.read('menu_items',id,function(err,data){
					if(!err && data){
						callback(200,data);
					} else {
						callback(404,{'Error':'Menu Item was not found!'});
					}
				});
			} else {
				callback(403,{'Error':'Missing required token in header, or token is invalid'});
			}
		});
	} else {
		callback(400,{'Error':'Missing required field!'});
	}
};

// Menu Items - put
// Required data: id
// Optional data: name, cost, size (at least one must be specified)
menu_items.put = function(data,callback){
	//Token needed to put menu items && AuthID
};

// Menu Items - delete
// Required data: id
menu_items.delete = function(data,callback){
	//Token needed to delete menu items && AuthID
};

// Export the module
module.exports = menu_items