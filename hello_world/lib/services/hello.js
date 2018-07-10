/*
 * These are the request handlers
 *
 */

// Dependencies


// Container for the user submethods
hello = {};

hello.acceptableMethods = ['post'];

// Hello - get
// Required data: none
// Optional data: none
hello.post = function(data,callback){
	callback(200,{'Success':'Welcome to our site'});
};


// Export the module
module.exports = hello