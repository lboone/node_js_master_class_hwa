/*
 * Primary file for the API
 *
 */

// Dependencies
let http = require('http');
let url = require('url');

let StringDecoder = require('string_decoder').StringDecoder;

let config = require('./lib/config');
let helpers = require('./lib/helpers');
let router = require('./lib/routers')

// Instantiate the HTTP server
var httpServer=http.createServer(function(req,res){
	unifiedServer(req,res)	
});

// Start the server
httpServer.listen(config.httpPort,function(){
	console.log('The server is listening on port ' + config.httpPort + '!');
});



// All ther server loginn for both the https server and the http server

var unifiedServer = function(req,res){
	// Get the URL and parse it
	var parsedURL = url.parse(req.url,true);

	// Get the path
	var path = parsedURL.pathname;
	var trimmedPath = path.replace(/^\/+|\/+$/g,'');

	// Get the query string as an object

	var queryStringObject = parsedURL.query;


	// Get the HTTP Method
	var method = req.method.toLowerCase();

	// Get the headers as an object
	var headers = req.headers;


	// Get the payload, if any
	var decoder = new StringDecoder('utf-8');
	var buffer = '';
	req.on('data',function(data){
		buffer += decoder.write(data);
	});

	req.on('end',function(){
		buffer += decoder.end();


		var chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : router['notFound'];

		// Construct the data object to send to the handler

		var data = {
			'trimmedPath' : trimmedPath,
			'queryStringObject' : queryStringObject,
			'method' : method,
			'headers' : headers,
			'payload' : helpers.parseJsonToObject(buffer)

		};
		// Route the request to the handler specified in the router
		chosenHandler(data,function(statusCode,payload){
			// Use the status code called back by the handler, or default to 200
			statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

			// Use the payload called back by the handler, or default to an empty object
			payload = typeof(payload) == 'object' ? payload : {};

			// Convert the payload to a string
			var payloadString = JSON.stringify(payload);

			// Return the response
			// Send the response
			res.setHeader('Content-Type','application/json');
			res.writeHead(statusCode);
			res.end(payloadString);

			// Log the requested path
			console.log('Returning this response: ',statusCode,payload);
		});

	});
}
