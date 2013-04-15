//-------------------------------------------//
//DatasetManager
//-------------------------------------------//

this.DatasetManager = {};

//-------------------------------------------//

DatasetManager.CHECK_RASTER_MILLIS = 5000;

//-------------------------------------------//

DatasetManager.initDatasets = function()
{
   for(var i=0; i< App.user.datasets.length; i++){
      (function(i){
         var dataset = App.user.datasets.objectAt(i);
         dataset.hasNoRaster = dataset.rasters.length == 0;
         
         for(var j=0; j< dataset.rasters.length; j++){
            (function(j, dataset){
               DatasetManager.checkRaster(dataset.rasters[j]);
            })(j, dataset);
         }
         
         DatasetManager.getHeader(dataset);
      })(i);
   }   
}

DatasetManager.getHeader = function(dataset)
{
   Utils.editObjectInArray(dataset, "onError", false);
   Utils.editObjectInArray(dataset, "badSeparator", false);

   $.ajax({
      type: "GET",  
      url: App.Globals.mapServer + "/api/dataset/header/"+dataset.uid+"?sep="+dataset.separator,
      dataType: "json",
      success: function (data)
      {
         Utils.editObjectInArray(dataset, "header", data.header);

         if(dataset.header.length == 1)
         {
            Utils.editObjectInArray(dataset, "onError", true);
            Utils.editObjectInArray(dataset, "badSeparator", true);
         }
      },
      error: function()
      {
         Utils.editObjectInArray(dataset, "onError", true);
      }
   });
}


//-------------------------------------------//
   
DatasetManager.addDataset = function(dataset)
{
   var params = new Object();
   params["user"] = App.user;
   params["dataset"] = dataset;

   $.ajax({  
      type: "POST",  
      url: "/addDataset",
      data: JSON.stringify(params),  
      contentType: "application/json; charset=utf-8",
      dataType: "text",
      success: function (data, textStatus, jqXHR)
      {
         Utils.editObjectInArray(dataset, "hasNoRaster", true);
         DatasetManager.getHeader(dataset);
      }
   });
}

//-------------------------------------------//

DatasetManager.editDataset = function(dataset)
{
   var params = new Object();
   params["dataset"] = dataset;
   
   $.ajax({  
      type: "POST",  
      url: "/editDataset",
      data: JSON.stringify(params),  
      contentType: "application/json; charset=utf-8",
   });
}

//-------------------------------------------//

DatasetManager.deleteDataset = function(dataset)
{
   $.ajax({  
      type: "DELETE",  
      url: App.Globals.mapServer + "/api/dataset?key=" + dataset.uid,
      dataType: "text",
      success: function (data, textStatus, jqXHR)
      {
         // remove from the user list
         App.user.datasets.removeObject(dataset);

         // remove from the db
         var params = new Object();
         params["dataset"] = dataset;

         $.ajax({  
            type: "POST",  
            url: "/removeDataset",
            data: JSON.stringify(params),  
            contentType: "application/json; charset=utf-8"
         });
      }
   });
}

//-------------------------------------------//

DatasetManager.validateRasterConfig = function(raster){

   var errorTitle = "This raster is not well configured";
   var checkMessage = "Check out this parameter : ";
   var area = "rasterErrorArea";

   $("#"+area).empty();

   if(!raster.x){
      Utils.alert(area, "error", errorTitle, checkMessage + "X column");
      return false;
   }   

   if(!raster.y){
      Utils.alert(area, "error", errorTitle, checkMessage + "Y column");
      return false;
   }   
   
   if(!raster.v){
      Utils.alert(area, "error", errorTitle, checkMessage + "Data");
      return false;
   }   
   
   if(!raster.proj){
      Utils.alert(area, "error", errorTitle, checkMessage + "Projection");
      return false;
   }   
   
   if(!raster.name){
      Utils.alert(area, "error", errorTitle, checkMessage + "Name");
      return false;
   }   
   
   return true;
}

//-------------------------------------------//

DatasetManager.createRaster = function(){
   
   App.datasetsData.set("rasterBeingConfigured.creationAsked", true);
   
   var dataset = App.datasetsData.selectedDataset;
   var raster = App.datasetsData.rasterBeingConfigured;

   if(!DatasetManager.validateRasterConfig(raster)){
      App.datasetsData.set("rasterBeingConfigured.creationAsked", false);
      return;
   }

   $.ajax({
      type: "POST",  
      url: App.Globals.mapServer + "/api/raster",
      data: $.param(raster),
      dataType: "json",
      error: function (e, message){
         console.log("Error during createRaster " + message);
      },
      success: function (data)
      {
         raster.uid = data.rasterUID;
         dataset.rasters.pushObject(raster);
         Utils.editObjectInArray(dataset, "hasNoRaster", false);

         $('#configureRasterWindow').modal("hide");

         DatasetManager.addRaster(raster);
         DatasetManager.checkRaster(raster);
      }
   });
}

DatasetManager.checkRaster = function(raster){
   
   Utils.editObjectInArray(raster, "onError", false);
   Utils.editObjectInArray(raster, "interpolating", true);
   
   $.ajax({
      type: "GET",  
      url: App.Globals.mapServer + "/api/raster/"+raster.uid,
      dataType: "json",
      error: function (e, message){
         Utils.editObjectInArray(raster, "onError", true);
         Utils.editObjectInArray(raster, "interpolating", false);
         Utils.editObjectInArray(raster, "error", "Configuration refused by the server");
      },
      success: function (data)
      {
         if(data.running != undefined){
            Utils.editObjectInArray(raster, "percentage", data.running);
            setTimeout(function(){DatasetManager.checkRaster(raster)}, DatasetManager.CHECK_RASTER_MILLIS);
         }
         else{
            Utils.editObjectInArray(raster, "interpolating", false);

            if(data.error != undefined && data.errCode != 0){
               // { "errcode" : 3, "error" : "Projection failed" }
               
               console.log(data.error);
               Utils.editObjectInArray(raster, "onError", true);
               Utils.editObjectInArray(raster, "error", data.error);
            }
            else{
               // { "bbox" : [ 2.96564, 45.7647, 3.11383, 45.7973 ], "inP" : 17, "max" : 12.8822, "min" : 10.7532 }
               Utils.editObjectInArray(raster, "nbPoints", data.inP);
               Utils.editObjectInArray(raster, "lonMin", data.bbox[0]);
               Utils.editObjectInArray(raster, "latMin", data.bbox[1]);
               Utils.editObjectInArray(raster, "lonMax", data.bbox[2]);
               Utils.editObjectInArray(raster, "latMax", data.bbox[3]);
            }
         }
      }
   });
   
}

DatasetManager.addRaster = function(raster)
{
   var params = new Object();
   params["dataset"] = App.datasetsData.selectedDataset;
   params["raster"] = raster;
   
   $.ajax({
      type: "POST",
      url: "/addRaster",
      data: JSON.stringify(params),  
      contentType: "application/json; charset=utf-8"
   });   
}

//-------------------------------------------//

DatasetManager.deleteRaster = function(raster, dataset)
{
   // ------------ a virer

   dataset.rasters.removeObject(raster);
   Utils.editObjectInArray(dataset, "hasNoRaster", dataset.rasters.length == 0);

   // remove from the db
   var params = new Object();
   params["raster"] = raster;

   $.ajax({  
      type: "POST",  
      url: "/removeRaster",
      data: JSON.stringify(params),  
      contentType: "application/json; charset=utf-8"
   });
   
   
   return;
    
   // ------------ 
   
   $.ajax({  
      type: "DELETE",  
      url: App.Globals.mapServer + "/api/raster?key=" + raster.uid,
      dataType: "text",
      success: function (data, textStatus, jqXHR)
      {
         dataset.rasters.removeObject(raster);
         Utils.editObjectInArray(dataset, "hasNoRaster", dataset.rasters.length == 0);

         // remove from the db
         var params = new Object();
         params["raster"] = raster;

         $.ajax({  
            type: "POST",  
            url: "/removeRaster",
            data: JSON.stringify(params),  
            contentType: "application/json; charset=utf-8"
         });
         
      }
   });
}

//-------------------------------------------//