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
orders = {};

orders.acceptableMethods = ['post','get','put','delete'];
orders.acceptableTypes = ['add','remove'];

// Users - post
// Required data: userPhone, 
// Optional data: menu_items [as an array]
orders.post = function(data,callback){
	var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
	var menu_items = typeof(data.payload.menu_items)	== 'object' && data.payload.menu_items instanceof Array && data.payload.menu_items.length	>0 ? data.payload.menu_items : false;
	if(phone){
		// Get the token from the headers
		var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

		// Verify that the given token from the headers is valid for the phone number
		tokens.verifyToken(token,phone,function(tokenIsValid){
			if(tokenIsValid){
				// Make sure that the user doesn't already exist
				_data.read('orders',phone,function(err,data){
					if(err){

						// Create the order object
						var orderObject = {
							'userPhone' 		: phone,
							'order_date'		: Date.now(),
							'menu_items'		: []
						};


						if(menu_items){
							mi_count = menu_items.length;
							mi_iter = 0;

							menu_items.forEach(function(menu_item){
								_data.read('menu_items',menu_item,function(err,menuObj){
									mi_iter +=1
									if(!err && menuObj){
										orderObject.menu_items.push(menu_item);
									};

									// If we are working on the last menu item create the order
									if(mi_iter == mi_count){
										_data.create('orders',phone,orderObject,function(err,orderData){
											if(!err){
												// Remove the hashed password from the user object
												callback(200,orderData);
											} else {
												callback(500,{'Error':'Could not create a new order for the user!'});
											}
										});
									}
								});
							});

						} else {
							// Store user to disk
							_data.create('orders',phone,orderObject,function(err,orderData){
								if(!err){
									// Remove the hashed password from the user object
									callback(200,orderData);
								} else {
									callback(500,{'Error':'Could not create a new order for the user!'});
								}
							});
						}

					} else {
						// User already exists
						callback(400,{'Error':'A order has been created for that user already!'});
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
orders.get = function(data,callback){
	// Check that the phone number provided is valid
	var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
	if(phone){
		// Get the token from the headers
		var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

		// Verify that the given token from the headers is valid for the phone number
		tokens.verifyToken(token,phone,function(tokenIsValid){
			if(tokenIsValid){
				// Lookup the user
				_data.read('orders',phone,function(err,data){
					if(!err && data){
						callback(200,data);
					} else {
						callback(404,{'Error':'That orders order was not found!'});
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
orders.put = function(data,callback){
	// Check that the phone number provided is valid
	var phone 	   = typeof(data.payload.phone) 		== 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
	var type  	   = typeof(data.payload.type)  		== 'string' && orders.acceptableTypes.indexOf(data.payload.type) > -1 ? data.payload.type : false;
	var menu_items = typeof(data.payload.menu_items)	== 'object' && data.payload.menu_items instanceof Array && data.payload.menu_items.length	>0 ? data.payload.menu_items : false;
	// Error if the phone is invalid
	if(phone && type && menu_items){
		_data.read('orders',phone,function(err,orderData){
			if(!err && orderData){
				// Are we adding the menu item or are we removing it
				if(type == 'remove'){
					// We are removing the menu item
					// Make sure user is not removing more item than we have in the order
					if(orderData.menu_items.length >= menu_items.length){
						//Remove the items from the order
						menu_items.forEach(function(menu_item){
							orderData.menu_items.splice(orderData.menu_items.indexOf(menu_item),1);
						});
						// Update the order
						_data.update('orders',phone,orderData,function(err,orderObj){
							if(!err && orderObj){
								callback(200,orderObj);
							} else {
								callback(500,{'Error':'Unable to make changes to the order, please try again!'});
							}
						});
					} else {
						callback(400,{'Error':'You are trying to remove more items than you have in your order!'});
					}
				} else {
					var num_items = menu_items.length;
					var num_iter = 0;
					menu_items.forEach(function(menu_item){
						_data.read('menu_items',menu_item,function(err,menuObj){
							num_iter += 1;	
							if(!err && menuObj){
								orderData.menu_items.push(menuObj.id);
							} 
							// If we read all of them now we can do something
							if( num_items == num_iter ) {
								_data.update('orders',phone,orderData,function(err,orderObj){
									if(!err && orderObj){
										callback(200,orderObj);
									} else {
										callback(500,{'Error':'Unable to make changes to the order, please try again!'});
									}
								});
							};
						});

					});
				}
			} else {
				callback(404,{'Error':'Could not find a order for that user!'});
			}
		});
	} else {
		callback(400,{'Error':'Missing required field!'});
	}
};

// Users - delete
// Required data: phone
orders.delete = function(data,callback){
	// Check that the phone number provided is valid
	var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
	if(phone){
		// Get the token from the headers
		var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
		// Verify that the given token from the headers is valid for the phone number
		tokens.verifyToken(token,phone,function(tokenIsValid){
			if(tokenIsValid){
				// Lookup the user
				_data.read('orders',phone,function(err,orderData){
					if(!err && orderData){
						_data.delete('orders',phone,function(err){
							if(!err){
								callback(200,{'Success':'User\'s order was deleted!'});
							} else {
								callback(500,{'Error':'Could not delete the specified user\'s order!'});
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
module.exports = orders