/*
 * Primary file for the API
 *
 */

// Dependencies
let server = require('./lib/server');


// Declare the app
var app = {};

app.init = function(){
	// Start the server
	server.init();
};

// Execute
app.init();

// Export the app
module.exports = app;