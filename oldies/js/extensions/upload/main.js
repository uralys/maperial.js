/*
 * ----------------------------------------------

 * jQuery File Upload Plugin JS Example 6.11
 * https://github.com/blueimp/jQuery-File-Upload
 *
 * Copyright 2010, Sebastian Tschan
 * https://blueimp.net
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 * 
 * ----------------------------------------------
 * 
 * Modified to be a maperial extension
 * 
 */

this.ExtensionUpload = {};
ExtensionUpload.init = function () 
{
   console.log("init extensionUpload");

   // Initialize the jQuery File Upload widget:
   var uploader = $('#fileupload').fileupload({
      // Uncomment the following to send cross-domain cookies:
      //xhrFields: {withCredentials: true},
      url: App.Globals.mapServer + '/api/dataset',

      add: function (e, data) {
         App.datasetsData.filesToUpload.pushObject(data);
      },

      progressInterval: 10,
      progress: function (e, data) {
         App.DatasetsController.progressUpload(data);
      },

      done: function (e, data) {
         App.DatasetsController.doneUpload(data);
      }
   });

   uploader.fileupload('option', {
      url: App.Globals.mapServer + '/api/dataset',
      maxFileSize: 15000000,
      acceptFileTypes: /(\.|\/)(pst|gif|jpe?g|png)$/i,
      process: [
          {
             action: 'load',
             fileTypes: /^image\/(gif|jpeg|png)$/,
             maxFileSize: 20000000 // 20MB
          },
          {
             action: 'resize',
             maxWidth: 1440,
             maxHeight: 900
          },
          {
             action: 'save'
          }
       ]
   });

   //-------------------------------------------------------------------//  

};
