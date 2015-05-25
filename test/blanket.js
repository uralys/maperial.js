'use strict';

/**
 * This file is loaded by blanket.js automatically before it instruments code to generate a code coverage report.
 */

var fs = require('fs');

var options = {
    pattern: [
      "src/js/core",
      "src/js/tools"
    ]
}

require('blanket')(options);

/**
 * Walks through a directory structure recursively and executes a specified action on each file.
 * @param dir {(string|string[])} The directory path or paths.
 * @param action {function} The function that will be executed on any files found.
 *      The function expects two parameters, the first is an error object, the second the file path.
 */
function walkDir(dir, action) {
    // Assert that action is a function
    if (typeof action !== "function") {
        action = function (error, file) {
        };
    }

    if (Array.isArray(dir)) {
        // If dir is an array loop through all elements
        for (var i = 0; i < dir.length; i++) {
            walkDir(dir[i], action);
        }
    } else {
        // Make sure dir is relative to the current directory
        // if (dir.charAt(0) !== '.') {
        //     dir = '../' + dir;
        // }

        // Read the directory
        fs.readdir(dir, function (err, list) {

            // Return the error if something went wrong
            if (err) return action(err);

            // For every file in the list, check if it is a directory or file.
            // When it is a directory, recursively loop through that directory as well.
            // When it is a file, perform action on file.
            list.forEach(function (file) {
                var path = dir + "/" + file;
                fs.stat(path, function (err, stat) {
                    if (stat && stat.isDirectory()) {
                        walkDir(path, action);
                    } else {
                        action(null, path);
                    }
                });
            });
        });
    }
};

// Loop through all paths in the blanket pattern
walkDir(options.pattern, function (err, path) {
    if (err) {
        console.error(err);
        return;
    }
    console.error('Including ' + path + ' for blanket.js code coverage');
    require(path);
});
