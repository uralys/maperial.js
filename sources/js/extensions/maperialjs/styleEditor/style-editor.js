//==================================================================//
//StyleEditor
//==================================================================//

StyleEditor.SIMPLE  = 1;
StyleEditor.FULL    = 2;
StyleEditor.BIGGEST = 3;

//==================================================================//

///@todo define a xsmall small standard large xlarge size for each element and each zoom level
StyleEditor.XSMALL     = "xsmall";
StyleEditor.SMALL      = "small";
StyleEditor.STANDART   = "standart";
StyleEditor.LARGE      = "large";
StyleEditor.XLARGE     = "xlarge";

//==================================================================//

function StyleEditor(container, container2, container3, mapView){

   console.log("  building styleEditor...");

   //-------------------------------------------------//

   this.mapView                  = mapView;
   this.style                    = this.mapView.stylesManager.getSelectedStyle();

   //-------------------------------------------------//

   this.size                     = StyleEditor.SIMPLE;
   this.currentLayerIndex        = 0;     // map.layer

   //-------------------------------------------------//

   //id <-> name/filter mapping
   this.mappingElements          = [];

   //the mapping (json)
   this.mapping                  = null; // link id (in style) with a "real" name & filter

   //-------------------------------------------------//
   // see categories.json

   this.categories               = null; 
   this.accordionElements        = [];
   this.selectedElements         = [];
   this.selectedGroup            = null;

   //-------------------------------------------------//
   // Zooms

   this.zoomGroups               = []
   this.selectedZooms            = []
   this.selectedZoomGroup        = null

   this.currentZmin              = 0;
   this.currentZmax              = 18;

   //-------------------------------------------------//

   this.styleEditorParentEl      = container;
   this.styleEditorParentEl2     = container2;
   this.styleEditorParentEl3     = container3;
   this.accordionPanel           = null;
   this.widgetDiv                = null;
   this.zoomDiv                  = null;

   //-------------------------------------------------//
   //current element id

   this.currentLayerId           = "001"; // layer.sublayer

   //-------------------------------------------------//

   this.debug                    = true;

   //-------------------------------------------------//

   this.initListeners();
   this.LoadCategories();
}

//==================================================================//

StyleEditor.prototype.initListeners = function (event) {

   var styleEditor = this;

   $(window).on(MaperialEvents.OPEN_STYLE, function(event, layerIndex, layerId){
      styleEditor.openWidgetFromMap(layerIndex, layerId)
   });

   $(window).on(MaperialEvents.EDIT_ZOOMS, function(event){
      styleEditor.showZoomGroupEdition()
   });

   $(window).on(MaperialEvents.OPEN_ZOOMS, function(event){
      styleEditor.openZooms()
   });

   $(window).on(MaperialEvents.VALIDATE_ZOOMS, function(event){
      styleEditor.newZoomGroup()
   });

   $(window).on(MaperialEvents.DELETE_ZOOM_GROUP, function(event){
      styleEditor.deleteZoomGroup()
   });

   $(window).on(MaperialEvents.ZOOM_TO_REFRESH, function(event, map, viewTriggering, typeTriggering, zoom){
      if(viewTriggering == styleEditor.mapView.name){
         styleEditor.refreshWidget()
         styleEditor.highlightCurrentZoom()
      }
   });

   $("#").on(MaperialEvents.MOUSE_UP, function(){
      $(".colorpicker").hide();
   });

   this.mapView.hud.panel(HUD.QUICK_EDIT).on("mouseup", function(){
      styleEditor.refreshAccordion()
      $(".colorpicker").hide();
   });

   this.mapView.hud.panel(HUD.ZOOMS).on("mouseup", function(){
      $(".colorpicker").hide();
   });

   this.mapView.hud.panel(HUD.DETAILS_MENU).on("mouseup", function(){
      $(".colorpicker").hide();
   });
}

StyleEditor.prototype.removeListeners = function (event) {
   $(window).off(MaperialEvents.OPEN_STYLE);
   $(window).off(MaperialEvents.EDIT_ZOOMS);
   $(window).off(MaperialEvents.OPEN_ZOOMS);
   $(window).off(MaperialEvents.VALIDATE_ZOOMS);
   $(window).off(MaperialEvents.MOUSE_UP);

   this.mapView.hud.panel(HUD.QUICK_EDIT).off("mouseup");
   this.mapView.hud.panel(HUD.ZOOMS).off("mouseup");
   this.mapView.hud.panel(HUD.DETAILS_MENU).off("mouseup");
}

//-------------------------------------------------------------------------------------------------//

StyleEditor.prototype.buildStyleEditor = function(){

   this.styleEditorParentEl.empty();   
   this.styleEditorParentEl2.empty();   
   this.styleEditorParentEl3.empty();   

   this.styleEditorParentEl.hide(); // hide me during loading

   this.accordionPanel = $('<div id="styleEditor_menu_maindiv'+this.mapView.name+'" class="styleEditor_menu_maindiv"></div>');
   this.accordionPanel.appendTo(this.styleEditorParentEl);

   this.widgetDiv = $('<div id="styleEditor_menu_widgetDiv'+this.mapView.name+'" class="styleEditor_menu_widgetDiv"></div>');
   this.widgetDiv.appendTo(this.styleEditorParentEl2);

   this.zoomDiv = $('<div id="styleEditor_menu_zoomDiv'+this.mapView.name+'" class="styleEditor_menu_zoomDiv" ></div>');
   this.zoomDiv.appendTo(this.styleEditorParentEl3);

   this.buildZoomView();
   this.buildAccordion();

   this.refresh()
   this.selectGroup(this.categories["Landscape"][0])()
}  

//========================================================================================================================//
//Change sublayer to edit
//========================================================================================================================//

StyleEditor.prototype.openWidgetFromAccordion = function(uid){
   var me = this;
   return function(){
      me.currentLayerId = uid;

      me.unselectGroup()
      me.unselectElements()
      me.selectElement(uid)

      me.refreshZoomAndWidget();
   } 
}

StyleEditor.prototype.openWidgetFromMap = function (layerIndex, subLayerId) {
   this.currentLayerIndex = layerIndex;
   this.currentLayerId    = this.getParentUID(subLayerId);

   this.unselectGroup()
   this.unselectElements()
   this.selectElement(this.currentLayerId)

   this.refresh();
}

//========================================================================================================================//

StyleEditor.prototype.refresh = function () {

   try{
      this.refreshAccordion();
      this.refreshZoomAndWidget()
   }
   catch(e){
      console.log("====================")
      console.log("pb trying to refresh with uid : ", this.currentLayerId)
   }
}

StyleEditor.prototype.refreshZoomAndWidget = function () {
   this.refreshWidget();
   this.resetEnabledZooms()
   this.refreshZoomSelection()
   this.highlightCurrentZoom()
}

//-------------------------------------------------------------------------------------------------//

StyleEditor.prototype.refreshMap = function(){
   if(this.size != StyleEditor.FULL || this.selectedZooms[this.mapView.context.zoom])
      $(window).trigger(MaperialEvents.STYLE_CHANGED, [this.mapView.name, this.currentLayerIndex]);
}


//--------------------------------------------------------------------------//

StyleEditor.prototype.refreshWidget = function(){


   switch (this.size) {

      case StyleEditor.SIMPLE:
         this.BuildSimpleWidget();
         break;   

      case StyleEditor.FULL:
         this.BuildFullWidget();
         break;
   }

   this.mapView.hud.placeElements();
}
