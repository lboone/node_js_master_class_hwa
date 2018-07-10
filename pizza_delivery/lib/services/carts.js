/*
 * These are the request handlers
 *
 */

// Dependencies
let _data = require('./../data');
let helpers = require('./../helpers');
let tokens = require('./tokens');
let config = require('./../config');

// Container for the user submethods
carts = {};

carts.acceptableMethods = ['post','get','put','delete'];
carts.acceptableTypes = ['add','remove'];

// Users - post
// Required data: userPhone, 
// Optional data: menu_items [as an array]
carts.post = function(data,callback){
	var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
	var menu_items = typeof(data.payload.menu_items)	== 'object' && data.payload.menu_items instanceof Array && data.payload.menu_items.length	>0 ? data.payload.menu_items : false;
	if(phone){
		// Get the token from the headers
		var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

		// Verify that the given token from the headers is valid for the phone number
		tokens.verifyToken(token,phone,function(tokenIsValid){
			if(tokenIsValid){
				// Make sure that the user doesn't already exist
				_data.read('carts',phone,function(err,data){
					if(err){

						// Create the cart object
						var cartObject = {
							'userPhone' 		: phone,
							'menu_items'		: []
						};


						if(menu_items){
							mi_count = menu_items.length;
							mi_iter = 0;

							menu_items.forEach(function(menu_item){
								_data.read('menu_items',menu_item,function(err,menuObj){
									mi_iter +=1
									if(!err && menuObj){
										cartObject.menu_items.push(menu_item);
									};

									// If we are working on the last menu item create the cart
									if(mi_iter == mi_count){
										_data.create('carts',phone,cartObject,function(err,cartData){
											if(!err){
												// Remove the hashed password from the user object
												callback(200,cartData);
											} else {
												callback(500,{'Error':'Could not create a new cart for the user!'});
											}
										});
									}
								});
							});

						} else {
							// Store user to disk
							_data.create('carts',phone,cartObject,function(err,cartData){
								if(!err){
									// Remove the hashed password from the user object
									callback(200,cartData);
								} else {
									callback(500,{'Error':'Could not create a new cart for the user!'});
								}
							});
						}

					} else {
						// User already exists
						callback(400,{'Error':'A cart has been created for that user already!'});
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

// Users - get
// Required data: phone
// Optional data: none
carts.get = function(data,callback){
	// Check that the phone number provided is valid
	var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
	if(phone){
		// Get the token from the headers
		var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

		// Verify that the given token from the headers is valid for the phone number
		tokens.verifyToken(token,phone,function(tokenIsValid){
			if(tokenIsValid){
				// Lookup the user
				_data.read('carts',phone,function(err,data){
					if(!err && data){
						callback(200,data);
					} else {
						callback(404,{'Error':'That carts cart was not found!'});
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

// Users - put
// Required data: phone, type [remove/add], menu_items [as an array]
// Optional data: firstName, lastName, password (at least one must be specified)
carts.put = function(data,callback){
	// Check that the phone number provided is valid
	var phone 	   = typeof(data.payload.phone) 		== 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
	var type  	   = typeof(data.payload.type)  		== 'string' && carts.acceptableTypes.indexOf(data.payload.type) > -1 ? data.payload.type : false;
	var menu_items = typeof(data.payload.menu_items)	== 'object' && data.payload.menu_items instanceof Array && data.payload.menu_items.length	>0 ? data.payload.menu_items : false;
	// Error if the phone is invalid
	if(phone && type && menu_items){
		_data.read('carts',phone,function(err,cartData){
			if(!err && cartData){
				// Are we adding the menu item or are we removing it
				if(type == 'remove'){
					// We are removing the menu item
					// Make sure user is not removing more item than we have in the cart
					if(cartData.menu_items.length >= menu_items.length){
						//Remove the items from the cart
						menu_items.forEach(function(menu_item){
							cartData.menu_items.splice(cartData.menu_items.indexOf(menu_item),1);
						});
						// Update the cart
						_data.update('carts',phone,cartData,function(err,cartObj){
							if(!err && cartObj){
								callback(200,cartObj);
							} else {
								callback(500,{'Error':'Unable to make changes to the cart, please try again!'});
							}
						});
					} else {
						callback(400,{'Error':'You are trying to remove more items than you have in your cart!'});
					}
				} else {
					var num_items = menu_items.length;
					var num_iter = 0;
					menu_items.forEach(function(menu_item){
						_data.read('menu_items',menu_item,function(err,menuObj){
							num_iter += 1;	
							if(!err && menuObj){
								cartData.menu_items.push(menuObj.id);
							} 
							// If we read all of them now we can do something
							if( num_items == num_iter ) {
								_data.update('carts',phone,cartData,function(err,cartObj){
									if(!err && cartObj){
										callback(200,cartObj);
									} else {
										callback(500,{'Error':'Unable to make changes to the cart, please try again!'});
									}
								});
							};
						});

					});
				}
			} else {
				callback(404,{'Error':'Could not find a cart for that user!'});
			}
		});
	} else {
		callback(400,{'Error':'Missing required field!'});
	}
};

// Users - delete
// Required data: phone
carts.delete = function(data,callback){
	// Check that the phone number provided is valid
	var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
	if(phone){
		// Get the token from the headers
		var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
		// Verify that the given token from the headers is valid for the phone number
		tokens.verifyToken(token,phone,function(tokenIsValid){
			if(tokenIsValid){
				// Lookup the user
				_data.read('carts',phone,function(err,cartData){
					if(!err && cartData){
						_data.delete('carts',phone,function(err){
							if(!err){
								callback(200,{'Success':'User\'s cart was deleted!'});
							} else {
								callback(500,{'Error':'Could not delete the specified user\'s cart!'});
							}
						});
					} else {
						callback(400,{'Error':'Cart for that user was not found!'});
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

// Export the module
module.exports = carts