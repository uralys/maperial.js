//=============================================================================//
//Layers Panel Drawing

/**
 * Draw the Layers panel
 */
HUD.prototype.refreshLayersPanel = function() {

   var me = this;

   this.element(HUD.LAYERS_CREATION).empty(); 

   //   var panelHeight = 80; tmp : no more settings
   var panelHeight = 35;

   //------------------//

   for(var i = this.mapView.config.layers.length - 1; i >= 0 ; i--) {
      this.buildLayerEntry(i);
      panelHeight += 57;
   }

   //------------------//
   
   this.element(HUD.LAYERS_CREATION).sortable({
      revert: 50,
      delay: 100,
      start: function(event, ui){
         me.mapView.maperial.layersCreation.preventNextEdit = true;
         me.layerBeingDraggedIndex = parseInt((ui.item[0].id).split("_")[1]);
      },
      stop: function(){
         me.mapView.maperial.layersCreation.preventNextEdit = false;
         me.exchangeLayers();
      }
   });

  this.panel(HUD.LAYERS_CREATION).css("height", panelHeight+"px");
}

//--------------------------------------//

HUD.prototype.buildLayerEntry = function(layerIndex) {

   var tooltip = ""
   var icon = "icon-eye-open"
   
   for (var i in this.mapView.config.map.osmSets) {
      var set = this.mapView.config.map.osmSets[i]

      if(layerIndex == set.layerPosition){
         if(tooltip != "") tooltip += ", "
         tooltip += set.label
      }
   }
   
   if(tooltip == ""){
      icon     = "icon-warning-sign"
      tooltip  = "Empty !"
   }
   
   var layer = this.mapView.config.layers[layerIndex];
   var html = "";

   html += "<div class=\"row-fluid movable marginbottom\" id=\"layer_"+layerIndex+"\">";
   html += "   <div class=\"span3 offset1\"><img class=\"selectable sourceThumb\" onclick='window.maperial.layersCreation.editLayer(\""+this.mapView.name+"\", "+layerIndex+")' "+Utils.getSourceThumb(layer)+"></img></div>";

   switch(layer.type){
      case LayersManager.Images:
         if(layer.source.type == Source.WMS){
            icon = "icon-screenshot"
            tooltip  = "Center"
            html += "   <div class=\"span1 touchable\" onclick='window.maperial.centerWMS(\""+this.mapView.name+"\", \""+layer.source.params.src+"\", \"place\")'><i id=\"eye_"+layerIndex+"\" class=\"icon-white "+icon+"\" title=\""+tooltip+"\"></i></div>";
            html += "   <div class=\"span1 offset3\"><button class=\"btn-small btn-danger\" onclick='window.maperial.layersCreation.deleteLayer(\""+this.mapView.name+"\", "+layerIndex+")'><i class=\"icon-trash icon-white\"></i></button></div>";
            break;
         }
         // else :
      case LayersManager.Raster:
      case LayersManager.Shade:
         html += "   <div class=\"span1 offset4\"><button class=\"btn-small btn-danger\" onclick='window.maperial.layersCreation.deleteLayer(\""+this.mapView.name+"\", "+layerIndex+")'><i class=\"icon-trash icon-white\"></i></button></div>";
         break;
      case LayersManager.Vector:
         html += "   <div class=\"span1 touchable\" onclick='window.maperial.layersCreation.customizeLayer(\""+this.mapView.name+"\", "+layerIndex+")'><i id=\"eye_"+layerIndex+"\" class=\"icon-white "+icon+"\" title=\""+tooltip+"\"></i></div>";
         html += "   <div class=\"span1 offset1 touchable\" onclick='window.maperial.layersCreation.editStyle(\""+this.mapView.name+"\", "+layerIndex+")'><i id=\"edit_"+layerIndex+"\" class=\"icon-white icon-pencil\" title=\"Edit\"></i></div>";
         html += "   <div class=\"span1 offset1\"><button class=\"btn-small btn-danger\" onclick='window.maperial.layersCreation.deleteLayer(\""+this.mapView.name+"\", "+layerIndex+")'><i class=\"icon-trash icon-white\"></i></button></div>";
         break;
   }

   html += "</div>";

   this.element(HUD.LAYERS_CREATION).append(html); 
   $( "#eye_"+layerIndex ).tooltipster({
      theme: '.tooltip-theme'
   })
   $( "#edit_"+layerIndex ).tooltipster({
      theme: '.tooltip-theme'
   })
}

//=======================================================================//

HUD.prototype.exchangeLayers = function(){

   // layers are ordered from bottom to top
   for(var i = (this.element(HUD.LAYERS_CREATION)[0].children.length - 1); i >= 0 ; i--){
      var layerIndex = this.element(HUD.LAYERS_CREATION)[0].children[i].id.split("_")[1];
      var k = (this.element(HUD.LAYERS_CREATION)[0].children.length-1) - i;

      // just found our layer in the new div list
      if(layerIndex == this.layerBeingDraggedIndex){
         if(this.layerBeingDraggedIndex == k){
            return;
         }
      }
   }

   var exchangedIds = {};
   for(var i = (this.element(HUD.LAYERS_CREATION)[0].children.length - 1); i >= 0 ; i--){

      var layerIndex = this.element(HUD.LAYERS_CREATION)[0].children[i].id.split("_")[1];
      var becomesIndex = (this.element(HUD.LAYERS_CREATION)[0].children.length-1) - i;

      exchangedIds[layerIndex] = becomesIndex
   }
   
   this.mapView.layersManager.exchangeLayers(exchangedIds);
}

//=================================================================================================================//

/**
 * On/off buttons to show hide osmSets
 */
HUD.prototype.buildOSMSets = function(layerCustomizedIndex){

   var layersManager = this.mapView.layersManager;
   var container = $("#osmSetsDiv");

   container.empty();
   var panelHeight = 0;

   for (var i in this.mapView.config.map.osmSets) {
      var set = this.mapView.config.map.osmSets[i];

      // ----- appending div
      var div = "<div class=\"row-fluid marginbottom\">" +
      "<div class=\"span5 offset1\">" + set.label + "</div>" +
      "<div class=\"slider-frame offset6\">" +
      "   <span class=\"slider-button\" id=\""+HUD.TOGGLE+i+"\"></span>" +
      "</div>" +
      "</div>";

      container.append(div); 
      panelHeight += 50;

      // ----- toggle listeners

      $('#'+HUD.TOGGLE+i).click(function(){
         if($(this).hasClass('on')){
            $(this).removeClass('on');
            var setIndex = $(this).context.id.replace(HUD.TOGGLE,"");
            layersManager.detachSet(setIndex, layerCustomizedIndex);
         }
         else{
            $(this).addClass('on');
            var setIndex = $(this).context.id.replace(HUD.TOGGLE,"");
            layersManager.attachSet(setIndex, layerCustomizedIndex);
         }
      });

      if(layerCustomizedIndex == set.layerPosition)
         $("#"+HUD.TOGGLE+i).addClass("on");
   }

   container.css("height", panelHeight+"px");
}

//=======================================================================//

/**
 * TODO (not 1.0)
 */
HUD.prototype.buildDetailledSets = function(){
   $("#osmSetsDiv").empty();
}


//====================================================================================//
//Map Settings 

/**
 * Draw the HUD Viewer Settings
 */
HUD.prototype.refreshHUDViewerSettings = function() {

   var me = this;
   $("#hudViewerSettings").empty(); 
   var panelHeight = 65;

   for (i in HUD.VIEWER_OPTIONS) {

      var element = HUD.VIEWER_OPTIONS[i].element;
      var label = HUD.VIEWER_OPTIONS[i].label;

      if(element == HUD.COMPOSITIONS && this.mapView.config.layers.length < 2)
         continue;

      if(element == HUD.SWITCH_IMAGES && !this.mapView.layersManager.atLeastOneImageLayer())
         continue;

      var nameInTag = element + this.mapView.name; 
      
      // ----- appending div
      var div = "<div class=\"row-fluid marginbottom\">" +
      "<div class=\"span5 offset1\">" + label + "</div>" +
      "<div class=\"slider-frame offset6\">" +
      "   <span class=\"slider-button\" id=\"toggleMapSettings_"+element+"\"></span>" +
      "</div>" +
      "</div>";

      $("#hudViewerSettings").append(div); 
      panelHeight += 50;
      
      // ----- toggle listeners

      $('#toggleMapSettings_'+element).click((function(element){
         return function(){
            if($(this).hasClass('on')){
               $(this).removeClass('on');
               me.mapView.config.hud.elements[element].show = false;
               me.mapView.hud.element(me.mapView.config.hud.elements[element].type+element).addClass("hide");

               if(me.mapView.config.hud.elements[element].type == HUD.TRIGGER)
                  me.mapView.hud.hideTrigger(element);
            }
            else{
               $(this).addClass('on');
               me.mapView.config.hud.elements[element].show = true;
               me.mapView.hud.element(me.mapView.config.hud.elements[element].type+element).removeClass("hide");
               me.mapView.hud.showTrigger(element);
            }
            
         };
      })(element));

      if(me.mapView.config.hud.elements[element].show){
         $("#toggleMapSettings_"+element).addClass("on");
      }
   }

   $("#panelSettings").css("height", panelHeight+"px");
}
