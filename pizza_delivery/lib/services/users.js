/*
 * These are the request handlers
 *
 */

// Dependencies
let _data = require('./../data');
let helpers = require('./../helpers');
let tokens = require('./tokens');

// Container for the user submethods
users = {};

users.acceptableMethods = ['post','get','put','delete'];

// Users - post
// Required data: firstName, lastName, phone, password, email, address
// Optional data: none
users.post = function(data,callback){
	// Check that all required fields are filled out
	var firstName 		= typeof(data.payload.firstName)	== 'string' && data.payload.firstName.trim().length	> 0 	? data.payload.firstName.trim() : false;
	var lastName 		= typeof(data.payload.lastName) 	== 'string' && data.payload.lastName.trim().length 	> 0 	? data.payload.lastName.trim() 	: false;
	var phone 			= typeof(data.payload.phone) 		== 'string' && data.payload.phone.trim().length 	== 10	? data.payload.phone.trim() 	: false;	
	var password 		= typeof(data.payload.password) 	== 'string' && data.payload.password.trim().length 	> 0 	? data.payload.password.trim() 	: false;
	var email 			= typeof(data.payload.email) 		== 'string'	&& data.payload.email.trim().length		> 0 	? data.payload.email.trim() 	: false;
	var address 		= typeof(data.payload.address)		== 'string' && data.payload.address.trim().length	> 0 	? data.payload.address.trim() 	: false;


	if(firstName && lastName && phone && password && email && address){
		// Make sure that the user doesn't already exist
		_data.read('users',phone,function(err,data){
			if(err){
				// Hash the password
				var hashedPassword = helpers.hash(password);
				if(hashedPassword){
					// Create the user object
					var userObject = {
						'firstName' 		: firstName,
						'lastName'			: lastName,
						'phone'				: phone,
						'hashedPassword'	: hashedPassword,
						'email'				: email,
						'address'			: address
					};

					// Store user to disk
					_data.create('users',phone,userObject,function(err,userData){
						if(!err){
							// Remove the hashed password from the user object
							delete userData.hashedPassword;
							callback(200,userData);
						} else {
							callback(500,{'Error':'Could not add a new user!'});
						}
					});
				} else {
					callback(500,{'Error':'Could not hash the user\'s password!'});
				};

			} else {
				// User already exists
				callback(400,{'Error':'A user with that phone number already exists!'});
			}
		});

	} else {
		callback(400,{'Error' : 'Missing required fields!'});
	}
};

// Users - get
// Required data: phone
// Optional data: none
users.get = function(data,callback){
	// Check that the phone number provided is valid
	var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
	if(phone){
		// Get the token from the headers
		var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

		// Verify that the given token from the headers is valid for the phone number
		tokens.verifyToken(token,phone,function(tokenIsValid){
			if(tokenIsValid){
				// Lookup the user
				_data.read('users',phone,function(err,data){
					if(!err && data){
						// Remove the hashed password from the user object
						delete data.hashedPassword;
						callback(200,data);
					} else {
						callback(404,{'Error':'User with phone number: ' + phone + ' was not found!'});
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
// Required data: phone
// Optional data: firstName, lastName, password (at least one must be specified)
users.put = function(data,callback){
	// Check that the phone number provided is valid
	var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;

	// Error if the phone is invalid
	if(phone){
	
		// Check for the optional fields
		var firstName	= typeof(data.payload.firstName)	== 'string'	&& data.payload.firstName.trim().length	> 0 ? data.payload.firstName.trim() : false;
		var lastName	= typeof(data.payload.lastName) 	== 'string' && data.payload.lastName.trim().length 	> 0 ? data.payload.lastName.trim() 	: false;
		var password	= typeof(data.payload.password) 	== 'string' && data.payload.password.trim().length 	> 0 ? data.payload.password.trim() 	: false;
		var email		= typeof(data.payload.email) 		== 'string'	&& data.payload.email.trim().length		> 0	? data.payload.email.trim() 	: false;
		var address		= typeof(data.payload.address)		== 'string' && data.payload.address.trim().length	> 0 ? data.payload.address.trim() 	: false;

		if(firstName || lastName || password || email || address){
				// Get the token from the headers
				var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
				// Verify that the given token from the headers is valid for the phone number
				tokens.verifyToken(token,phone,function(tokenIsValid){
					if(tokenIsValid){
						// Lookup the user
						_data.read('users',phone,function(err,userData){
							if(!err && userData){
								
								if(firstName){
									userData.firstName = firstName;
								}
								if(lastName){
									userData.lastName = lastName;
								}
								if(password){
									userData.hashedPassword = helpers.hash(password);
								}
								if(email){
									userData.email = email;
								}
								if(address){
									userData.address = address;
								}								
								// Store the new updates
								_data.update('users',phone,userData,function(err,data){
									if(!err){
										// Remove the hashed password from the user object
										delete data.hashedPassword;
										callback(200,data);
									} else {
										callback(500,{'Error':'Could not update the user!'});
									}
								});
								
							} else {
								callback(404,{'Error':'User with phone number: ' + phone + ' was not found!'});
							}
						});

					} else {
						callback(403,{'Error':'Missing required token in header, or token is invalid'});
					}
				});
		} else {
			callback(400,{'Error':'Missing fields to update!'});
		}
	} else {
		callback(400,{'Error':'Missing required field!'});
	}
};

// Users - delete
// Required data: phone
users.delete = function(data,callback){
	// Check that the phone number provided is valid
	var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
	if(phone){
		// Get the token from the headers
		var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
		// Verify that the given token from the headers is valid for the phone number
		tokens.verifyToken(token,phone,function(tokenIsValid){
			if(tokenIsValid){
				// Lookup the user
				_data.read('users',phone,function(err,userData){
					if(!err && userData){
						_data.delete('users',phone,function(err){
							if(!err){

								// Delete each of the carts for the user			

								// Delete each of the checks associated with the user
								var userTokens = typeof(userData.tokens) == 'object' && userData.tokens instanceof Array ? userData.tokens : [];
								var tokensToDelete = userTokens.length
								if(tokensToDelete > 0){
									// Loop through all the tokens
									userTokens.forEach(function(tokenId){
										// Delete the check
										_data.delete('tokens',tokenId,function(err){
											if(err){
												deletionErrors = true;
											} 
										});
									});
								}
								if(!deletionErrors){
									callback(200,{'Success':'User with phone number: ' + phone + ' was deleted!'});
								} else{
									callback(500,{'Error':'Errors encountered while attempting to delete all of the user\'s checks or tokens.  All checks or tokens may not have been deleted from the system successfully!'});
								}
								

							} else {
								callback(500,{'Error':'Could not delete the specified user!'});
							}
						});
					} else {
						callback(400,{'Error':'User with phone number: ' + phone + ' was not found!'});
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
module.exports = users