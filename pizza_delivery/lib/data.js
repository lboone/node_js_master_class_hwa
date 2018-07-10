/*
 * Library for storing and editing data
 *
 */

// Dependencies
let fs = require('fs');
let path = require('path');
let helpers = require('./helpers')

// Container for the module (to be exported)
var lib = {};

// Define the basedirectory of the data folder
lib.baseDir = path.join(__dirname,'/../.data/');

// List all the data in a directory
lib.list = function(dir,callback){
	fs.readdir(lib.baseDir+dir+'/',function(err,data){
		if(!err && data && data.length > 0){
			var trimmedFileNames = [];
			data.forEach(function(fileName){
				trimmedFileNames.push(fileName.replace('.json',''));
			});
			callback(false,trimmedFileNames);
		} else {
			callback(err,data);
		}
	});
}

// Write data to a file
lib.create = function(dir,file,data,callback){
  // Open the file for writing
  fs.open(lib.jsonPath(dir,file), 'wx', function(err, fileDescriptor){
    if(!err && fileDescriptor){
      // Convert data to string
      var stringData = JSON.stringify(data);

      // Write to file and close it
      fs.writeFile(fileDescriptor, stringData,function(err){
        if(!err){
          fs.close(fileDescriptor,function(err){
            if(!err){
            	var parsedData = helpers.parseJsonToObject(stringData);
              	callback(false,parsedData);
            } else {
           	callback('Error closing new file!',{});
            }
          });
        } else {
         	callback('Error writing to new file!',{});
        }
      });
    } else {
    	callback('Could not create new file, it may already exist!',{});
    }
  });
};

// Read data from a file
lib.read = function(dir,file,callback){
	fs.readFile(lib.jsonPath(dir,file),'utf8',function(err,data){
		if(!err && data){
			var parsedData = helpers.parseJsonToObject(data);
			callback(false,parsedData);		
		} else {
			callback(err,data);
		}
		
	});
};

// Update existing file with new data
lib.update = function(dir,file,data,callback){
	// Open the file for writing
	fs.open(lib.jsonPath(dir,file),'r+',function(err,fileDescriptor){
		if(!err && fileDescriptor){
			// Convert data to string
			var stringData = JSON.stringify(data);

			//Truncate the file
			fs.truncate(fileDescriptor,function(err){
				if(!err){
					// Write to the file and close it
					fs.writeFile(fileDescriptor,stringData,function(err){
						if (!err){
							fs.close(fileDescriptor,function(err){
								if(!err){
									var parsedData = helpers.parseJsonToObject(stringData)
									callback(false,parsedData);
								} else {
									callback('There was an error closing the file!',{});
								}
							});
						} else {
							callback('Error writing to existing file!',{});
						}
					})
				} else {
					callback('Error truncating file!',{})
				}
			})

		} else {
			callback('Could not open the file for updating, it may not exist yet!',{});
		}
	});
}

// Delete an existing file
lib.delete = function(dir,file,callback){
	// Unlink the file
	fs.unlink(lib.jsonPath(dir,file),function(err){
		if(!err){
			callback(false);
		} else {
			callback('Error deleting the file!');
		}
	})
}

lib.jsonPath = function(dir,file){
	return lib.baseDir+'/'+dir+'/'+file+'.json';
}

// Export the module
module.exports = lib;