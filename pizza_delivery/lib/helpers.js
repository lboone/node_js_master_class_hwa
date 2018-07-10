/*
 * Helpers for various tasks
 *
 */

// Dependecies
let crypto = require('crypto');
let querystring = require('querystring');
let https = require('https');
let config = require('./config');


// Container for all the helpers
var helpers = {};

// Hash a password using SHA256
helpers.hash = function(str){
	if(typeof(str) == 'string' && str.length > 0){
		var hash = crypto.createHmac('sha256',config.hashingSecret).update(str).digest('hex');
		return hash;
	} else {
		return false;
	}
};

// Parse a JSON string to an object in all cases, without throwing
helpers.parseJsonToObject = function(str){
	try{
		var obj = JSON.parse(str);
		return obj;
	}catch(e){
		return {};
	}
}

// Create a string of random alpha numeric characters of a given length
helpers.createRandomString = function(strLength){
	strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : config.defaultTokenStringLength;
	if(strLength){

		// Start the final string
		var str = '';

		for (i = 1; i <= strLength; i++) {
			// Get a random character from the possibleCharacters string
			var randomCharacter = config.possibleTokenCharacters.charAt(Math.floor(Math.random()* config.possibleTokenCharacters.length));

			// Append this character to the final string
			str+=randomCharacter;
		}
		return str;
	} else {
		return false;
	}
}

// Create a helper function that generates an expiration time
helpers.expires = function(){
	return Date.now() + 1000 * 60 * 60;
}


// Export the module
module.exports = helpers;