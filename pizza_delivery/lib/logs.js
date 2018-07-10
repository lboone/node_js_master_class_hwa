/*
 * A library for storing and rotating logs
 *
 */

// Dependencies
let fs = require('fs');
let path = require('path');
let zlib = require('zlib');

// Container for the module
var lib = {};

// Define the basedirectory of the data folder
lib.baseDir = path.join(__dirname,'/../.logs/');

// Append a string to a file. Create the file if it does not exist.
lib.append = function(file,str,callback){
	// Open the file for appending
	fs.open(lib.baseDir+file+'.log','a',function(err,fileDescriptor){
		if(!err && fileDescriptor){
			// Append to the file and close it
			fs.appendFile(fileDescriptor,str+'\n',function(err){
				if(!err){
					fs.close(fileDescriptor,function(err){
						if(!err){
							callback(false);
						} else {
							callback('Error closing file that was being appended!');
						};
					});
				} else {
					callback('Error appending the file!');
				};
			});
		} else {
			callback('Could not open file for appending!');
		};
	});
};

// List all the logs and optionally include the compressed logs
lib.list = function(includeCompressedLogs,callback){
	fs.readdir(lib.baseDir,function(err,data){
		if(!err && data && data.length > 0){
			var trimmedFileNames = [];
			data.forEach(function(fileName){
				// Add the .log files
				if(fileName.indexOf('.log') > -1){
					trimmedFileNames.push(fileName.replace('.log',''));
				}

				// Add on the .gz.b64 files
				if(fileName.indexOf('.gz.b64') > -1 && includeCompressedLogs){
					trimmedFileNames.push(fileName.replace('.gz.b64',''));
				}
			});
			callback(false,trimmedFileNames);
		} else {
			callback(err,data);
		}
	});
}

// Compress the contents of one .log file into a .gz.b64 file within the same directory
lib.compress = function(logId,newFileId,callback){
	var sourceFile = logId+'.log';
	var destinationFile = newFileId+'.gz.b64';

	// Read the source file
	fs.readFile(lib.baseDir+sourceFile,'utf8',function(err,inputString){
		if(!err && inputString){
			//  Compress the data using gzip
			zlib.gzip(inputString,function(err,buffer){
				if(!err && buffer){
					// Send the new compressed data to the destination file
					fs.open(lib.baseDir+destinationFile,'wx',function(err,fileDescriptor){
						if(!err && fileDescriptor){
							// Write to the destination file
							fs.writeFile(fileDescriptor,buffer.toString('base64'),function(err){
								if(!err){
									// Close the destination file
									fs.close(fileDescriptor,function(err){
										if(!err){
											callback(false);
										} else {
											callback(err);
										}
									});
								} else {
									callback(err);
								}
							});
						} else {
							callback(err);
						}
					});
				} else {
					callback(err);
				}
			});
		} else {
			callback(err);
		}
	});
};

// Decompress the contents of one .gz.b64 into a string variable
lib.decompress = function(fileId,callback){
	var fileName =fileId + 'gz.b64';
	fs.readFile(lib.baseDir+fileName,'utf8',function(err,str){
		if(!err && str){
			// Decompress the data
			var imputBuffer = Buffer.from(str,'base64');
			zlib.unzip(inputBuffer,function(err,outputBuffer){
				if(!err && outputBuffer){
					// Callback
					var str = outputBuffer.toString();
					callback(false,str);
				} else {
					callback(err);
				}
			});
		} else {
			callback(err);
		}
	});
};

// Truncate a log file
lib.truncate = function(logId,callback){
	fs.truncate(lib.baseDir+logId+'.log',0,function(err){
		if(!err){
			callback(false);
		} else {
			callback(err);
		}
	});
};

// Export the module
module.exports = lib;