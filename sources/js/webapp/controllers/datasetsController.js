
(function() {
	'use strict';

	var DatasetsController = Ember.ObjectController.extend({});

	//==================================================================//
	 
	DatasetsController.renderUI = function()
	{
	   ExtensionUpload.init();
	}

	DatasetsController.cleanUI = function()
	{
	   
	}

	//==================================================================//
	// Controls

	DatasetsController.openUploadWindow = function() 
	{
      $("#uploadDatasetsWindow").reveal({
         animation: 'fade',
         animationspeed: 100, 
      });
	}
	
	DatasetsController.startUpload = function(data) 
	{
      data.isUploading = true;
      data.submit();

      App.datasetsData.filesToUpload.removeObject(data);
      App.datasetsData.set("nbfilesCurrentlyUploading", (App.datasetsData.nbfilesCurrentlyUploading + 1)) ;
	}

	DatasetsController.progressUpload = function(data) 
	{
	   var progress = parseInt(data.loaded / data.total * 100, 10);
	   var index = App.datasetsData.filesUploading.indexOf(data);
	   
	   // -> first progressUpload : add the data in filesUploading
	   if(index == -1){
	      App.datasetsData.filesUploading.pushObject(data);
	      index = App.datasetsData.filesUploading.indexOf(data);
	   }

	   var data = App.datasetsData.filesUploading.objectAt(index);
	   Utils.editObjectInArray(data, "percentage", progress);
	}
	
	
	DatasetsController.doneUpload = function(data) 
	{
	   //--------------------------------------------
	   // placement dans users.datasets
	   
	   // data.files[0] = file envoyé
      // data.result.files[0] = file retour upload

      var dataset = {
            name : data.result.files[0].name,
            size : data.result.files[0].size,
            uid  : data.result.files[0].uid,
            separator : ",",
            rasters : []
      };
      
      App.user.datasets.pushObject(dataset);
      DatasetManager.addDataset(dataset);

      App.datasetsData.set("nbfilesCurrentlyUploading", (App.datasetsData.nbfilesCurrentlyUploading - 1)) ;
	}
	
	//----------------------------------------------------//
	
	DatasetsController.openEditDatasetWindow = function(dataset) 
	{
	   App.datasetsData.set("selectedDataset", dataset);
	   $( "#datasetNameInput" ).val(dataset.name);

      $("#editDatasetWindow").reveal({
         animation: 'fade',
         animationspeed: 100, 
      });
      
      $("#editDatasetWindow").off("reveal:hidden");
      $('#editDatasetWindow').on("reveal:hidden", function(){
         Utils.editObjectInArray(dataset, "name", $("#datasetNameInput").val());
         DatasetManager.editDataset(dataset);
      });
	}

	//----------------------------------------------------//
	
	DatasetsController.openConfigureRasterWindow = function(dataset) 
	{
	   App.datasetsData.set("selectedDataset", dataset);
	   App.datasetsData.set("rasterBeingConfigured", {});
	   App.datasetsData.set("rasterBeingConfigured.creationAsked", false);
	   App.datasetsData.set("rasterBeingConfigured.sep", dataset.separator);
	   App.datasetsData.set("rasterBeingConfigured.datasetUID", dataset.uid);
	   App.datasetsData.set("rasterBeingConfigured.zMin", App.Globals.RASTER_DEFAULT_ZMIN);
	   App.datasetsData.set("rasterBeingConfigured.zMax", App.Globals.RASTER_DEFAULT_ZMAX);

	   $("#rasterErrorArea").empty();
	   $( "#rasterNameInput" ).val(dataset.name + " raster " + (dataset.rasters.length+1));
	   
	   $( "#projections" ).autocomplete({
	      source: App.Globals.epsg,
	      select: function( event, ui ) {
	         App.datasetsData.set("rasterBeingConfigured.proj", ui.item.value);
	      }
	    }).val('');
	   
	   $( "#rasterZoomSlider" ).slider({
         range: true,
         min: 1,
         max: 18,
         values: [ App.datasetsData.rasterBeingConfigured.zMin, App.datasetsData.rasterBeingConfigured.zMax ],
         change: function( event, ui ) {
            var minV = ui.values[0];
            var maxV = ui.values[1];
            App.datasetsData.set("rasterBeingConfigured.zMin", minV);
            App.datasetsData.set("rasterBeingConfigured.zMax", maxV);
         },
         slide: function( event, ui ) {
            if ( (ui.values[0] + 1) > ui.values[1] ) {
               return false;      
            }                      
            var minV = ui.values[0];
            var maxV = ui.values[1];
            App.datasetsData.set("rasterBeingConfigured.zMin", minV);
            App.datasetsData.set("rasterBeingConfigured.zMax", maxV);
         }
	   });

      $("#configureRasterWindow").reveal({
         animation: 'fade',
         animationspeed: 100, 
      });
      
	}

	//----------------------------------------------------//
	
	DatasetsController.selectX = function(column){
	   App.datasetsData.set("rasterBeingConfigured.x", column);
	} 

	DatasetsController.selectY = function(column){
	   App.datasetsData.set("rasterBeingConfigured.y", column);
	} 

	DatasetsController.selectV = function(column){
	   App.datasetsData.set("rasterBeingConfigured.v", column);
	} 

	DatasetsController.selectSeparator = function(separator){
	   Utils.editObjectInArray(App.datasetsData.selectedDataset, "separator", separator);
	   DatasetManager.getHeader(App.datasetsData.selectedDataset);
	} 

	//----------------------------------------------------//

	DatasetsController.createRaster = function(){
      App.datasetsData.set("rasterBeingConfigured.name", $("#rasterNameInput").val());
	   DatasetManager.createRaster();
	}
	
	//----------------------------------------------------//
	
	App.DatasetsController = DatasetsController;

	//==================================================================//
	// Routing

	App.DatasetsRouting = App.Page.extend({
		route: '/datasets',
		
		connectOutlets: function(router){
			App.Router.openPage(router, "datasets");
		},
		
		//-----------------------------------------------//
		// actions
		
		// ---- upload actions
		startUpload: function(router, event){
         DatasetsController.startUpload(event.context);
      },

      cancelUpload: function(router, event){
         DatasetsController.removeUpload(event.context);
      },

      removeUpload: function(router, event){
         DatasetsController.removeUpload(event.context);
      },
      
      openUploadWindow: function(){DatasetsController.openUploadWindow()},
      
      openEditDatasetWindow: function(router, event){
         var dataset = event.context;
         DatasetsController.openEditDatasetWindow(dataset);
      },

      // ---- 		
		deleteDataset: function(router, event){
			var dataset = event.context;
			DatasetManager.deleteDataset(dataset);
		},

		// ---- 		
		openConfigureRasterWindow: function(router, event){
		   var dataset = event.context;
		   DatasetsController.openConfigureRasterWindow(dataset);
		},
		
      createRaster: function(){
         DatasetsController.createRaster();
      },
      
		deleteRaster: function(router, event){
		   var raster = event.contexts[0];
		   var dataset = event.contexts[1];
		   DatasetManager.deleteRaster(raster, dataset);
		},
		// ---- 		

		selectX: function(router, event){
		   var column = event.context;
		   DatasetsController.selectX(column);
		},

		selectY: function(router, event){
		   var column = event.context;
		   DatasetsController.selectY(column);
		},
		
		selectV: function(router, event){
		   var column = event.context;
		   DatasetsController.selectV(column);
		},
		
		selectSeparator: function(router, event){
		   var separator = event.context;
		   
		   DatasetsController.selectSeparator(separator);
		},

	});


	
	//--------------------------------------------------------------------------//
	
})();

