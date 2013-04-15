//----------------------------//

function LayersHelper (maperial, mapCreationController) {
   this.maperial = maperial;
   this.mapCreationController = mapCreationController;
   this.layerBeingDraggedIndex = null;
}

//----------------------------//

LayersHelper.TOGGLE = "toggleLayerSet";

//=============================================================================//
//Layers Panel Drawing

/**
 * Draw the Layers panel
 */
LayersHelper.prototype.refreshLayersPanel = function() {

   var me = this;
   $("#layers").empty(); 
   var panelHeight = 35;

   for(var i = App.maperial.config.layers.length - 1; i >= 0 ; i--) {
      this.buildLayerEntry(i);
      panelHeight += 64;
   }

   $("#layers").sortable({
      revert: true,
      delay: 200,
      start: function(event, ui){
         me.mapCreationController.preventNextEdit = true;
         me.layerBeingDraggedIndex = parseInt((ui.item[0].id).split("_")[1]);
      },
      stop: function(){
         me.mapCreationController.preventNextEdit = false;
         me.exchangeLayers();
      }
   });

   $("#panelLayers"+this.maperial.tagId).css("height", panelHeight+"px");
   $("#panelLayers"+this.maperial.tagId).removeClass("hide"); // maperial reset hideAllHUD + no layers => no HUD => orce show here
}

//--------------------------------------//

LayersHelper.prototype.buildLayerEntry = function(layerIndex) {

   var layer = App.maperial.config.layers[layerIndex];
   var html = "";
   
   html += "<div class=\"row-fluid movable marginbottom\" id=\"layer_"+layerIndex+"\">";
   html += "   <div class=\"span4 offset1\"><img class=\"selectable sourceThumb\" onclick=\"App.MapCreationController.editLayer("+layerIndex+")\" "+Utils.getSourceThumb(layer)+"></img></div>";
   
   switch(layer.type){
   case LayersManager.Images:
   case LayersManager.Raster:
      html += "   <div class=\"span1 offset4\"><button class=\"btn-small btn-danger\" onclick=\"App.MapCreationController.deleteLayer("+layerIndex+")\"><i class=\"icon-trash icon-white\"></i></button></div>";
      break;
   case LayersManager.Vector:
      html += "   <div class=\"span1 offset1\"><button class=\"btn-small btn-success\" onclick=\"App.MapCreationController.customizeLayer("+layerIndex+")\"><i class=\"icon-edit icon-white\"></i></button></div>";
      html += "   <div class=\"span1 offset2\"><button class=\"btn-small btn-danger\" onclick=\"App.MapCreationController.deleteLayer("+layerIndex+")\"><i class=\"icon-trash icon-white\"></i></button></div>";
      break;
   }
      
   html += "</div>";
   
   $("#layers").append(html); 

}

//=======================================================================//

LayersHelper.prototype.exchangeLayers = function(){

   // layers are ordered from bottom to top
   for(var i = ($("#layers")[0].children.length - 1); i >= 0 ; i--){
      var layerIndex = $("#layers")[0].children[i].id.split("_")[1];
      var k = ($("#layers")[0].children.length-1) - i;

      // just found our layer in the new div list
      if(layerIndex == this.layerBeingDraggedIndex){
         if(this.layerBeingDraggedIndex == k){
            return;
         }
      }
   }

   var exchangedIds = {};
   for(var i = ($("#layers")[0].children.length - 1); i >= 0 ; i--){

      var layerIndex = $("#layers")[0].children[i].id.split("_")[1];
      var k = ($("#layers")[0].children.length-1) - i;

      exchangedIds[layerIndex] = k;
      $("#layer_"+layerIndex).attr("id", "layer_"+k);

   }

   this.maperial.layersManager.exchangeLayers(exchangedIds);
}

//=================================================================================================================//

/**
 * On/off buttons to show hide osmSets
 */
LayersHelper.prototype.buildOSMSets = function(layerCustomizedIndex){

   var layersManager = this.maperial.layersManager;
   var container = $("#osmSetsDiv");

   container.empty();
   var panelHeight = 0;

   for (var i in this.maperial.config.map.osmSets) {
      var set = this.maperial.config.map.osmSets[i];

      // ----- appending div
      var div = "<div class=\"row-fluid marginbottom\">" +
      "<div class=\"span5 offset1\">" + set.label + "</div>" +
      "<div class=\"slider-frame offset6\">" +
      "   <span class=\"slider-button\" id=\""+LayersHelper.TOGGLE+i+"\"></span>" +
      "</div>" +
      "</div>";

      container.append(div); 
      panelHeight += 50;

      // ----- toggle listeners

      $('#'+LayersHelper.TOGGLE+i).click(function(){
         if($(this).hasClass('on')){
            $(this).removeClass('on');
            var setIndex = $(this).context.id.replace(LayersHelper.TOGGLE,"");
            layersManager.detachSet(setIndex);
         }
         else{
            $(this).addClass('on');
            var setIndex = $(this).context.id.replace(LayersHelper.TOGGLE,"");
            layersManager.attachSet(setIndex, layerCustomizedIndex);
         }
      });

      if(layerCustomizedIndex == set.layerPosition)
         $("#"+LayersHelper.TOGGLE+i).addClass("on");
   }

   container.css("height", panelHeight+"px");
}

//=======================================================================//

/**
 * TODO (not usefull for a DEMO)
 */
LayersHelper.prototype.buildDetailledSets = function(){
   $("#osmSetsDiv").empty();
}




//====================================================================================//
//Map Settings 

/**
 * Draw the HUD Viewer Settings
 */
LayersHelper.prototype.refreshHUDViewerSettings = function() {

   var me = this;
   $("#hudViewerSettings").empty(); 
   var panelHeight = 65;

   for (i in HUD.VIEWER_OPTIONS) {

      var element = HUD.VIEWER_OPTIONS[i].element;
      var label = HUD.VIEWER_OPTIONS[i].label;

      if(element == HUD.COMPOSITIONS && this.maperial.config.layers.length < 2)
         continue;

      if(element == HUD.SWITCH_IMAGES && !this.maperial.layersManager.atLeastOneImageLayer())
         continue;

      var nameInTag = element + this.maperial.tagId; 
      
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
               me.maperial.config.hud.elements[element].show = false;
               me.maperial.hud.element(me.maperial.config.hud.elements[element].type+element).addClass("hide");

               if(me.maperial.config.hud.elements[element].type == HUD.TRIGGER)
                  me.maperial.hud.hideTrigger(element);
            }
            else{
               $(this).addClass('on');
               me.maperial.config.hud.elements[element].show = true;
               me.maperial.hud.element(me.maperial.config.hud.elements[element].type+element).removeClass("hide");
               me.maperial.hud.showTrigger(element);
            }
            
         };
      })(element));

      if(me.maperial.config.hud.elements[element].show){
         $("#toggleMapSettings_"+element).addClass("on");
      }
   }

   $("#panelSettings").css("height", panelHeight+"px");
}














