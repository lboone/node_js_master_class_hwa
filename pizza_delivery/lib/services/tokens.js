/*
 * These are the request handlers
 *
 */

// Dependencies
let _data = require('./../data');
let helpers = require('./../helpers');
let config = require('./../config');

// Container for the user submethods
tokens = {};

tokens.acceptableMethods = ['post','get','put','delete'];

// Tokens - post
// Required data: phone, password
// Optional data: none
tokens.post = function(data,callback){
	// Check that all required fields are filled out
	var phone 			= typeof(data.payload.phone) 			== 'string' 	&& data.payload.phone.trim().length 		== 10 		? data.payload.phone.trim() 	: false;	
	var password 		= typeof(data.payload.password) 		== 'string' 	&& data.payload.password.trim().length 		> 0 		? data.payload.password.trim() 	: false;

	if(phone && password){
		// Lookup user who matches that phone number
		_data.read('users',phone,function(err,userData){
			if(!err && userData){
				// Hash the sent password and compare it with the stored password in the object
				var hashedPassword = helpers.hash(password);
				if(hashedPassword == userData.hashedPassword){
					// If valid create a new token with a random name.  Set expiration date 1 hour in the future.
					var tokenId = helpers.createRandomString(config.defaultTokenStringLength);
					var expires = helpers.expires();
					var tokenObject = {
						'phone': phone,
						'id': tokenId,
						'expires':expires
					}
					// Store the token
					_data.create('tokens',tokenId,tokenObject,function(err){
						if(!err){
							var userTokens = typeof(userData.tokens) == 'object' && userData.tokens instanceof Array ? userData.tokens : [];
							userData.tokens = userTokens;
							userData.tokens.push(tokenId);
							// Save the new user data
							_data.update('users',phone,userData,function(err,data){
								if(!err){
									// User is successful in logging in, now give them the list of menu items.
									_data.list('menu_items',function(err,menuItems){
										if(!err && menuItems){
											var items = [];
											var itemsToRead = menuItems.length;
											var itemsRead = 0;
											menuItems.forEach(function(menuId){
												_data.read('menu_items',menuId,function(err,menuItem){
													if(!err && menuItem){
														itemsRead += 1;
														items.push(menuItem);
														if (itemsRead == itemsToRead){
															console.log(items);
															callback(200,{'token':tokenObject,'menu_items':items});
														}
													} else {
														console.log(err)
													}
												});
											});
										} else {
											callback(200,tokenObject);		
										}
									});
								} else {
									callback(500,{'Error':'Could not update the user with the new token!'});
								}
							});
						} else {
							callback(500,{'Error':'Could not create the new token!'});
						}
					});

				} else {
					callback(400,{'Error':'Password did not match the specified user\'s stored password!'});
				}
			} else {
				callback(400,{'Error':'User with that phone number: ' +phone+' could not be found!'});
			}
		});

	} else {
		callback(400,{'Error' : 'Missing required fields!'});
	}
};

// Tokens - get
// Required data: id
// Optional data: none
tokens.get = function(data,callback){
	// Check that the id number provided is valid
	var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == config.defaultTokenStringLength ? data.queryStringObject.id.trim() : false;
	if(id){
		// Lookup the user
		_data.read('tokens',id,function(err,tokenData){
			if(!err && tokenData){
				callback(200,tokenData);
			} else {
				callback(404,{'Error':'Token with id: ' + id + ' was not found!'});
			}
		});
	} else {
		callback(400,{'Error':'Missing required field!'});
	}
};

// Tokens - put
// Required data: id, extend
// Optional data: none
tokens.put = function(data,callback){
	// Check that the phone number provided is valid
	var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == config.defaultTokenStringLength ? data.payload.id.trim() : false;
	var extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true 		? data.payload.extend : false;

	if(id && extend){
		// Lookup the tokan
		_data.read('tokens',id,function(err,tokenData){
			if(!err && tokenData){
				// Check to make sure the token isn't already expired
				if(tokenData.expires > Date.now()){
					// Set the expiration an hour from now
					tokenData.expires = helpers.expires();

					_data.update('tokens',id,tokenData,function(err){
						if(!err){
							callback(200,tokenData);
						} else {
							callback(500,{'Error':'Could not update the token\'s expiration!'});
						}
					});

				} else {
					callback(400,{'Error':'The token has already expired and cannot be extended!'});
				}
			} else {
				callback(400,{'Error':'Specified token does not exist!'});
			}
		})
	} else {
		callback(400,{'Error':'Missing required field(s) or field(s) are invalid!'});
	}
};

// Tokens - delete
// Required data: id
// Optional data: none
tokens.delete = function(data,callback){
	// Check that the id provided is valid
	var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == config.defaultTokenStringLength ? data.queryStringObject.id.trim() : false;
	if(id){
		// Lookup the user
		_data.read('tokens',id,function(err,tokenData){
			if(!err && tokenData){
				_data.delete('tokens',id,function(err){
					if(!err){
						_data.read('users',tokenData.phone,function(err,userData){
							if(!err && userData){
								// Get the list of user tokens
								var userTokens = typeof(userData.tokens) == 'object' && userData.tokens instanceof Array ? userData.tokens : [];
								
								// Now remove the deleted check from the list
								var tokenPosition = userTokens.indexOf(id);
								if(tokenPosition > -1){
									userTokens.splice(tokenPosition,1);
									// Re-save the users data.
									userData.tokens = userTokens;

									_data.update('users',tokenData.phone,userData,function(err){
										if(!err){
											callback(200,{'Success':'Token was deleted!'});
										} else {
											callback(500,{'Error':'Unable to remove the check from the user\'s check list!'});
										}
									});
								} else {
									callback(500,{'Error':'Unable to find the check on the user\'s object, so could not remove it!'});
								}

							} else {
								callback(400,{'Error':'User with phone number: ' + tokenData.phone + ' was not found!'});
							}
						});
					} else {
						callback(500,{'Error':'Could not delete the specified token!'});
					}
				});
			} else {
				callback(400,{'Error':'Token was not found!'});
			}
		});
	} else {
		callback(400,{'Error':'Missing required field!'});
	}
};

// Verify if a given token id is currently valid for a given user
tokens.verifyToken = function(id,phone,callback){
	// Lookup the token
	_data.read('tokens',id,function(err,tokenData){
		if(!err && tokenData){
			// Check that the token is for the given user and has not expired

			if(tokenData.phone == phone && tokenData.expires > Date.now()){
				callback(true);
			} else {
				callback(false);
			}
		} else {
			callback(false)
		}
	});
};

// Export the module
module.exports = tokens