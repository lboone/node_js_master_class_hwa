/*
 * These are server related tasks
 *
 */

// Dependencies
let http = require('http');
let https = require('https');
let url = require('url');
let fs = require('fs');
let path = require('path');
var util = require('util');
var debug = util.debuglog('server');

let StringDecoder = require('string_decoder').StringDecoder;

let config = require('./config');
let helpers = require('./helpers');
let router = require('./routers')

// Instantiate the server module object

var server = {};


// Instantiate the HTTP server
server.httpServer=http.createServer(function(req,res){
	server.unifiedServer(req,res)	
});

// Define server options
server.httpsServerOptions = {
	'key' : fs.readFileSync(path.join(__dirname,'/../https/key.pem')),
	'cert': fs.readFileSync(path.join(__dirname,'/../https/cert.pem'))
};

// Instantiate the HTTPS server
server.httpsServer = https.createServer(server.httpsServerOptions,function(req,res){
	server.unifiedServer(req,res)
});


// All ther server loginn for both the https server and the http server

server.unifiedServer = function(req,res){
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
			console.log('Payload:',payload);
			
			// Use the payload called back by the handler, or default to an empty object
			payload = typeof(payload) == 'object' ? payload : {};

			// Convert the payload to a string
			var payloadString = JSON.stringify(payload);

			// Return the response
			// Send the response
			res.setHeader('Content-Type','application/json');
			res.writeHead(statusCode);
			res.end(payloadString);

			// If the response is 200, print green otherwise print red
			if(statusCode == 200){
				debug('\x1b[32m%s\x1b[0m',method.toUpperCase()+' /'+trimmedPath+' '+statusCode);
			} else {
				debug('\x1b[31m%s\x1b[0m',method.toUpperCase()+' /'+trimmedPath+' '+statusCode);
			}
			
		});

	});
}

server.init = function(){
	// Start the HTTP server
	server.httpServer.listen(config.httpPort,function(){
		console.log('\x1b[36m%s\x1b[0m','The server is listening on port ' + config.httpPort + '!');
	});
	// Start the HTTPS server
	server.httpsServer.listen(config.httpsPort,function(){
		console.log('\x1b[35m%s\x1b[0m','The server is listening on port ' + config.httpsPort + '!');
	});
}

// Export the module
module.exports = server;