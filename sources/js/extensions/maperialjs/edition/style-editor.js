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

   //-------------------------------------------------//
   // style edition default 
   this.openWidgetFromMap(this.currentLayerIndex, this.currentLayerId);
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
   $(window).off(MaperialEvents.MOUSE_UP);

   this.mapView.hud.panel(HUD.QUICK_EDIT).off("mouseup");
   this.mapView.hud.panel(HUD.ZOOMS).off("mouseup");
   this.mapView.hud.panel(HUD.DETAILS_MENU).off("mouseup");
}

//=================================================================================================================//
//PREPARE
//========================================================================================================================//

//AJaX load group
StyleEditor.prototype.LoadCategories = function(){
   if(this.debug)console.log("Loading categories");
   var me = this;
   $.ajax({
      url: Maperial.staticURL+'/style/categories.json',
      async: false,
      dataType: 'json',
      success: function (data) {
         me.categories   = data.categories;
         me.LoadMapping();
      },
      error: function (){
         console.log("==========================================================")
         console.log("Couln't load categories");
      }
   });
}

//-------------------------------------------------------------------------------------------------//

//AJaX load mapping
StyleEditor.prototype.LoadMapping = function(){
   if(this.debug)console.log("Loading mapping");
   var me = this;

   $.ajax({
      url: Maperial.staticURL+'/style/mapping.json',
      async: false,
      dataType: 'json',
      //contentType:"application/x-javascript",
      success: function (data) {
         me.mapping = data;
         me.buildMappingElements();
      },
      error: function (){
         if(me.debug)console.log("Loading mapping failed");
      }
   });
}

StyleEditor.prototype.buildMappingElements = function(){
   if(this.debug)console.log("##### MAPPING ####");

   for(var entrie = 0 ; entrie < this.mapping.length ; entrie++){
      //if(this.debug)console.log(this.mapping[entrie]["name"]);
      // build elements object
      for( var layer = 0 ; layer < this.mapping[entrie]["layers"].length ; layer++){
         
         var uid     = this.mapping[entrie]["layers"][layer]["id"]
         var name    = this.mapping[entrie]["name"]
         var filter  = this.mapping[entrie]["layers"][layer]["filter"]
         
         this.mappingElements[ uid ] = { name : name , filter : filter};
      }
   }
   
   this.BuildElements();  
}

//-------------------------------------------------------------------------------------------------//

StyleEditor.prototype.BuildElements = function(){

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
}  

//-------------------------------------------------------------------------------------------------//

StyleEditor.prototype.Refresh = function(){
   $(window).trigger(MaperialEvents.STYLE_CHANGED, [this.mapView.name, this.currentLayerIndex]);
}

//===============================================================================================================//
//UTILS
//========================================================================================================================//

StyleEditor.prototype.SetParam = function(uid,rule,param,value){
   var def = 0
   if ( this.style.content[uid] == undefined ){
      if(this.debug)console.log( uid + " not in style");
      return false;
   }

   var ok = false;
   for( var p = 0 ; p < this.style.content[uid]["s"][rule]["s"][def].length ; p++){ // params
      var property = Symbolizer.getParamName(this.style.content[uid]["s"][rule]["s"][def]["rt"],p);
      if ( property == param ){
         this.style.content[uid]["s"][rule]["s"][def][property] = value;
         var zmin = this.style.content[uid]["s"][rule]["zmin"];
         //if(this.debug)console.log("changing for z " + zmin);
         ok = true;
         break;
      }
   }
   if ( !ok ){
      //if(this.debug)console.log(" not found , adding!" , uid , rule, def , param);
      this.style.content[uid]["s"][rule]["s"][def][param] = value;
   }

   this.Refresh();
   return ok;
}


StyleEditor.prototype.SetParamId = function(uid,ruid,param,value){
   if ( this.style.content[uid] == undefined ){
      if(this.debug)console.log( uid + " not in style");
      return false;
   }
   for(var rule = 0 ; rule < this.style.content[uid]["s"].length ; rule++){
      for( var d = 0 ; this.style.content[uid]["s"][rule]["s"].length ; d++){ //def
         if( this.style.content[uid]["s"][rule]["s"][d]["id"] == ruid ){
            for( var p = 0 ; p < this.style.content[uid]["s"][rule]["s"][d].length ; p++){ //params
               var property = Symbolizer.getParamName(this.style.content[uid]["s"][rule]["s"][d]["rt"],p);
               if ( property == param ){
                  this.style.content[uid]["s"][rule]["s"][d][property] = value;

                  this.Refresh();
                  return true;
               }
            }
            //if(this.debug)console.log(" not found , adding!" , uid , ruid , param);
            this.style.content[uid]["s"][rule]["s"][d][param] = value;

            this.Refresh();
            return true;
         }
      }
   }
   if(this.debug)console.log("----------->   uid not found !" , uid , ruid , param);
   return false;
}


StyleEditor.prototype.changeProperty = function(uid, param, value){

   var uidsToEdit = []
   
   if(this.selectedGroup){
      for ( var e in this.selectedGroup.elements ){   
         var element = this.selectedGroup.elements[e]
         uidsToEdit.push(element.uid)
         console.log(element.uid)
      }
   }
   else{
      uidsToEdit.push(uid)
   }
   
   console.log(uidsToEdit.length + " uids")
   for(var i = 0; i < uidsToEdit.length; i++){
      var uid = uidsToEdit[i]
      console.log("changeProperty", uid, param, value, this.selectedZooms)
      
      if ( this.style.content[uid] == undefined ){
         console.log( uid + " not in style");
         return false;
      }
      
      var rules   = this.style.content[uid]["s"]
      var nbRules = rules.length
      
      console.log(nbRules + " rules")
      for(var r = 0 ; r < nbRules; r++){
         var z = rules[r]["zmin"];
         
         if ( this.selectedGroup || this.selectedZooms[z] ){
            console.log("set param")
            this.SetParam(uid,r,param,value);
         }
      }
   }
   
   return true;
}


StyleEditor.prototype.getValue = function(uid, ruleId, param){

   if ( this.style.content[uid] == undefined ){
      return Symbolizer.defaultValues[param];
   }

   var rules = this.style.content[uid]["s"]

   for(var i = 0 ; i < rules.length ; i++){
      var rule = rules[i]["s"][0]
      if(rule["id"] == ruleId)
         return rule[param]
   }

   return Symbolizer.defaultValues[param];
}

//----------------------------------------------------------------------------//

StyleEditor.prototype.getUIDs = function(name){
   var ids = Array();
   if ( name == "none" ){
      return ids;
   }
   for(var entrie = 0 ; entrie < this.mapping.length ; entrie++){
      if ( this.mapping[entrie]["name"] == name){
         for( var layer = 0 ; layer < this.mapping[entrie]["layers"].length ; layer++){
            ids.push(this.mapping[entrie]["layers"][layer]["id"]);
         }
      }
   }
   return ids;
}

StyleEditor.prototype.getUID = function(element){
   
   var name      = element.name
   var filter    = element.filter
   
   for(var entrie = 0 ; entrie < this.mapping.length ; entrie++){
      if ( this.mapping[entrie]["name"] == name){
         for( var layer = 0 ; layer < this.mapping[entrie]["layers"].length ; layer++){
            if ( filter == null || this.mapping[entrie]["layers"][layer]["filter"].indexOf(filter) != -1){
               return this.mapping[entrie]["layers"][layer]["id"];
            }
         }
      }
   }
   return null;
}

//--------------------------------------------------------------------------//

/**
 * exemple : clic sur motorway_centerline :
 * on a le uid de name = 'motorway_centerline', ce qui n'est pas bon
 *  
 * donc ici on recup le parent : parent.name = motorway, puis le parent.uid dans elements.uids
 * => return le parent.uid = elements.uids['motorway']
 */
StyleEditor.prototype.getParentUID = function (subLayerId) {

   var name = this.mappingElements[subLayerId].name

   var splitCasing = name.split("_casing")
   if(splitCasing.length > 1){
      var casing = {name : splitCasing[0]}
      return this.getUID(casing)
   } 

   var splitCenter = name.split("_centerline")
   if(splitCenter.length > 1){
      var center = {name : splitCenter[0]}
      return this.getUID(center)
   }

   return subLayerId
}


//========================================================================================================================================//
//ZOOMS
//========================================================================================================================//

StyleEditor.prototype.showZoomGroupEdition = function(){
   this.container = $("#"+this.mapView.name);

   var html = "<div id='menuZoomGroupEdition' class='reveal-modal'><h2>Zooms "+this.selectedZoomGroup.zmin+" to "+this.selectedZoomGroup.zmax+"</h2>";

   if(this.zoomGroups.length > 1){
      html +=  "<div class='row-fluid'><div class='span3 offset2 btn-danger btn-large touchable '>Delete</div></div>";
   }

   html +=  "<div class='row-fluid'><div class='span4 offset4 btn-large btn-primary touchable' onclick='$(window).trigger(MaperialEvents.OPEN_ZOOMS)'>Split</div></div>";

   html +=  "<a class='close-reveal-modal'>&#215;</a></div>";

//   this.container.append(html);

//   this.menuZoomGroupEdition = $("#menuZoomGroupEdition").reveal({
//      animation: 'fade',
//      animationspeed: 300, 
//   });

  this.openZooms()
}

//-------------------------------------------------------------------------------------------------//

StyleEditor.prototype.openZooms = function(){
   //this.menuZoomGroupEdition.trigger("reveal:close")

   //------------------------------------------------------//

   var availableMin, availableMax
   var selectedMin           = parseInt(this.selectedZoomGroup.zmin)
   var selectedMax           = parseInt(this.selectedZoomGroup.zmax)

   //------------------------------------------------------//
   
   for(var z = 0 ; z < 19 ; z++){
      
      $("#zoomButton" + z ).uncheck();
      $("#zoomButton" + z ).disable();
      $("#zoomButton" + z ).button("refresh");
      
      if(this.enableZooms[z]){
         if(availableMin == null)
            availableMin = z
         
         availableMax = z
         $("#zoomButton" + z ).enable();
         $("#zoomButton" + z ).button("refresh");
      }
   }

   console.log("available " + availableMin, availableMax)
   console.log("selected " + selectedMin, selectedMax)

   //------------------------------------------------------//

   for(var z = selectedMin ; z <= selectedMax ; z++){
      $("#zoomButton" + z ).check();
      $("#zoomButton" + z ).button("refresh");
   }

   //------------------------------------------------------//

   $( "#zoomSlider" ).slider({
      min: availableMin,
      max: availableMax
   })

   $( "#zoomSlider" ).slider( "values",  [selectedMin, selectedMax] );  

   //------------------------------------------------------//

   $( "#zoomSlider" ).css("width", ((availableMax-availableMin)*35)+"px");
   $( "#zoomSlider" ).css("margin-left", (10 + availableMin*35)+"px");

   //------------------------------------------------------//

   $("#"+HUD.ZOOMS).reveal({
      animation: 'none',
   });
}

//-------------------------------------------------------------------------------------------------//

StyleEditor.prototype.resetEnabledZooms = function(){
   this.enableZooms  = []
   var rules         = this.style.content[this.currentLayerId]["s"]
   var nbRules       = rules.length
   console.log("---------- resetEnabledZooms, nbRules : " + nbRules)

   for(var i = 0 ; i < nbRules; i++){
      var zmin = rules[i]["zmin"]
      console.log("- enable : " + zmin)
      this.enableZooms[zmin] = true
   }
}

//----------------------------------------------------------------------------------------------------------------------//

StyleEditor.prototype.highlightCurrentZoom = function(){
   for ( var z = 0 ; z < 19 ; ++z){
      if(z == this.mapView.GetZoom())
         $("#zoomButton"+z+"_label").css("border", "4px solid  #45f");
      else
         $("#zoomButton"+z+"_label").css("border", "1px solid");
   }
}

//----------------------------------------------------------------------------------------------------------------------//

//simple  :   zoomGroup = null
//full    :   zoomGroup = selected zoomGroup
StyleEditor.prototype.refreshZoomSelection = function(){

   this.selectedZooms = []

   switch (this.size) {

      case StyleEditor.SIMPLE: // edition de tous les zooms

         var rules         = this.style.content[this.currentLayerId]["s"]
         var nbRules       = rules.length

         for(var i = 0 ; i < nbRules; i++){
            var zmin = rules[i]["zmin"]
            this.selectedZooms[zmin] = true
         }

         break;   

      case StyleEditor.FULL: // edition du zoomGroup selectionné

         if(!this.selectedZoomGroup)
            this.selectedZoomGroup  = this.zoomGroups[0]

         for(var z = parseInt(this.selectedZoomGroup.zmin) ; z < parseInt(this.selectedZoomGroup.zmax)+1 ; z++)
            this.selectedZooms[""+z] = true

            break;
   }   
}

//----------------------------------------------------------------------------------------------------------------------//
//
//StyleEditor.prototype.refreshSliderSelection = function(min, max){
//
//   this.currentZmin = min;
//   this.currentZmax = max;
//
//   for(var z = 0 ; z < 19 ; z++){
//      if ( z >= min && z <= max){
//         $("#zoomButton" + z ).check();
//      }
//      else{
//         $("#zoomButton" + z ).uncheck();
//      }
//
//      $("#zoomButton" + z ).button("refresh");
//   }
//
//   $( "#zoomSlider" ).slider( "values",  [min, max] );  
//}


//StyleEditor.prototype.updateSelectedZooms = function(){
//console.log("------------ updateSelectedZooms ", this.currentLayerId)

//this.selectedZooms = [];
//for ( var z = 0 ; z < 19 ; ++z){
//if ( $("#zoomButton" + z).is(":checked") ){
//this.selectedZooms.push(z);    
//}
//} 
//}

//----------------------------------------------------------------------------------------------------------------------//

StyleEditor.prototype.buildZoomView = function(){
   
   var me = this;
   var buttons = '';
   for ( var z = 0 ; z < 19 ; z++){
      buttons += '  <input type="checkbox" id="zoomButton' + z + '"/><label id="zoomButton' + z + '_label" class="zoom-button" for="zoomButton' + z + '">' + z + '</label>';
   }    

   $('<div id="zoomButtons">' +  buttons + '</div>' ).appendTo(this.zoomDiv);
   $('<div id="zoomSlider"></div><br/>').appendTo(this.zoomDiv);

   for ( var z = 0 ; z < 19 ; z++){
      $("#zoomButton"+z).change(function(zoom){
         return function(){
            console.log("changing zoomButton"+zoom)
            me.selectedZooms[zoom] = !me.selectedZooms[zoom] 
         }
      }(z));
   }

   $( "#zoomButtons" ).buttonset();

   $( "#zoomSlider" ).slider({
      range: true,
      min: 1,
      max: 18,
      values: [ this.currentZmin, this.currentZmax ],
      slide: function( event, ui ) {
         if ( (ui.values[0] + 1) > ui.values[1] ) {
            return false;      
         }                      
         var min = ui.values[0];
         var max = ui.values[1];

         console.log("slide ", min, max)
//       me.refreshZoomSelection(min, max) -- TODO : refreshzoom EDition : creation d'un zoomGroup ici !
      }
   });

// $( "#zoomSlider" ).slider( "values",  [this.currentZmin, this.currentZmax+1] );

   Utils.buildSliderStyle("zoomSlider");

}


//in the next callback "_ruleId" is the *caller* rule id.
//but thanks to changeProperty we are updating many zooms at the same time


//------------------------------------------------------------------//

StyleEditor.prototype.getRuleForCurrentZoom = function(uid){
   return this.getRule(uid, this.mapView.context.zoom)
}

StyleEditor.prototype.getRule = function(uid, zoom){

   var rules = this.style.content[uid]["s"]

   for (var i = 0; i < rules.length; i++){
      if(rules[i].zmin == zoom){
         return rules[i]["s"][0]
      }
   }

   return null
}

StyleEditor.prototype.getFirstRule = function(uid){
   return this.style.content[uid]["s"][0]["s"][0]
}

//------------------------------------------------------------------//

StyleEditor.prototype.gatherRulesByZoom = function(uid){

   var rules         = this.style.content[uid]["s"]
   var start         = rules[0].zmin
   var end           = rules[0].zmin
   var currentRule   = rules[0]["s"][0]

   var endWithNewRule
   this.zoomGroups    = []

   for (var i = 1; i < rules.length; i++){
      var nextRule = rules[i]["s"][0]
      if(this.isSameRule(currentRule, nextRule)){
         end = rules[i].zmin
         endWithNewRule = false
      }
      else{
         this.createZoomGroup(start, end, currentRule, uid)
         currentRule = nextRule
         start       = rules[i].zmin
         end         = rules[i].zmin
         endWithNewRule = true
      }
   }

   if(!endWithNewRule){
      this.createZoomGroup(start, end, currentRule, uid)
   }
}

StyleEditor.prototype.createZoomGroup = function(start, end, currentRule, uid){

   var zoomGroup = {}
   zoomGroup.zmin = start
   zoomGroup.zmax = end
   zoomGroup.rule = currentRule

   try{
      var casing = { name : this.accordionElements[uid].casing }
      var casingUID = this.getUID(casing);

      var center = { name : this.accordionElements[uid].center }
      var centerUID = this.getUID(center);
      
      // on cherche s'il y a au moins un zoom pour lequel un casing est editable parmi les zooms de ce zoomGroup
      if ( casingUID ){
         zoomGroup.casingUID = casingUID

         for(var z = parseInt(zoomGroup.zmin) ; z < parseInt(zoomGroup.zmax)+1 ; z++){
            zoomGroup.casingRule = this.getRule(casingUID, z)
            if(zoomGroup.casingRule) break
         }
      }

      // on cherche s'il y a au moins un zoom pour lequel un center est editable parmi les zooms de ce zoomGroup
      if ( centerUID ){
         zoomGroup.centerUID = centerUID

         for(var z = parseInt(zoomGroup.zmin) ; z < parseInt(zoomGroup.zmax)+1 ; z++){
            zoomGroup.centerRule = this.getRule(centerUID, z)
            if(zoomGroup.centerRule) break
         }
      }    
   }
   catch(e){}

   this.zoomGroups.push(zoomGroup)
}

//------------------------------------------------------------------//

StyleEditor.prototype.isSameRule = function(rule1, rule2){

   for(var property1 in rule1){
      var found = false

      for(var property2 in rule2){

         if(property1 == property2){
            found = true

            if(rule1.property1 != rule2.property2)
               return false
         }
      }

      if(!found)
         return false
   }

   return true
}

//------------------------------------------------------------------//

StyleEditor.prototype.getZoomGroupLabel = function(zoomGroup){
   if(zoomGroup.zmin != zoomGroup.zmax)
      return zoomGroup.zmin +" - "+zoomGroup.zmax   
      else
         return zoomGroup.zmin
}


//=============================================================================================================================//
//ACCORDION
//========================================================================================================================//


StyleEditor.prototype.buildAccordion = function(){

   $("#accordion").remove();
   var accordion = $("<div class='accordion' id='accordion'></div>");
   accordion.appendTo(this.accordionPanel);

   var categoryNum = 0;

   for ( var categoryName in this.categories ){ // for all groups of element
      
      //--------------------------------------------------------------------//

      var category = this.categories[categoryName]

      //--------------------------------------------------------------------//

      $("<p class='accordionCategoryTitle' id='accordionCategoryTitle" + categoryNum + "'>"  + categoryName + "</p>").appendTo(accordion);
      var accordionCategory = $("<div class='accordionCategory' id='accordionCategory" + categoryNum +  "'></div>");
      accordionCategory.appendTo(accordion);

      //--------------------------------------------------------------------//

      var groupNum = 0;
      for ( var i in category ){
         
         //--------------------------------------------------------------------//

         var group = category[i]
         
         //--------------------------------------------------------------------//
         
         var groupTitle = $('<p class="accordionGroupTitle" id="accordionGroupTitle_' + group.id + '">' + group.surname + "</p>");
         accordionCategory.append(groupTitle);
         groupTitle.bind('click', this.selectGroup(group));
         
         
         var groupContent = $("<div class='accordionGroup' id='accordionGroup_" + group.id + "'></div>");
         groupContent.appendTo(accordionCategory);

         //--------------------------------------------------------------------//
         
         for ( var e in group.elements ){   
            
            var element          = group.elements[e]
            element.uid          = this.getUID(element)
            element.categoryNum  = categoryNum
            element.groupNum     = groupNum
            
            if(!element.uid)
               continue // not in this specific style

            this.registerElement(element, groupContent)
         }

         groupNum++;
      } 
      
      categoryNum++;
   }


   //this.updateSelectedZooms();

   // configure accordion(s)
   $( ".accordion" )
   .accordion({
      heightStyle: "content",
      collapsible: true,
      active: false
   })

   $( ".accordionCategory" )
   .accordion({
      heightStyle: "content",
      collapsible: false,
      active: false
   })

   this.styleEditorParentEl.show();   //show me !
}


//----------------------------------------------------------------------------------------------------------------------//

StyleEditor.prototype.registerElement = function(element, container){
   
   console.log("     registerElement", element.name)
   
   //-------------------------------------//
   
   var uid = this.getUID(element)
   this.accordionElements[uid] = element

   //-------------------------------------//

   // bind onclick header event!
   var html = "<div id='accordionElement_"+uid+"' class='row-fluid accordionElement'><p class='accordionElementName'>"+element.surname+"</p></div"
   container.append(html)
   $("#accordionElement_"+uid).bind('click', this.openWidgetFromAccordion(uid));
}

//----------------------------------------------------------------------------------------------------------------------//

StyleEditor.prototype.refreshAccordion = function(){
   
   var categoryNum   = this.accordionElements[this.currentLayerId].categoryNum;
   var groupNum      = this.accordionElements[this.currentLayerId].groupNum;
   
   $("#accordion").accordion("option", "active", categoryNum);
   $("#accordionCategory" + categoryNum).accordion("option", "active", groupNum);
}

//--------------------------------------------------------------------------//

StyleEditor.prototype.selectGroup = function(group){
   var me = this
   return function() {
      me.unselectElements()
      
      if(me.selectedGroup)$("#accordionGroupTitle_" + me.selectedGroup.id).removeClass("selected")
      me.selectedGroup = group
      $("#accordionGroupTitle_" + me.selectedGroup.id).addClass("selected")
      
      for ( var e in group.elements ){   
         var element = group.elements[e]
         me.selectElement(element.uid)
      }
      
      me.size = StyleEditor.SIMPLE
      me.currentLayerId = group.elements[0].uid
      me.refreshZoomAndWidget();
   }
}
   
//--------------------------------------------------------------------------//

StyleEditor.prototype.selectElement = function(uid){
   var accordionElement = $("#accordionElement_"+uid)
   accordionElement.addClass("selected")
   this.selectedElements.push(uid)
}

//--------------------------------------------------------------------------//

StyleEditor.prototype.unselectGroup = function(){
   if(this.selectedGroup){
      $("#accordionGroupTitle_" + this.selectedGroup.id).removeClass("selected")
      this.selectedGroup = null
   }
}

//--------------------------------------------------------------------------//

StyleEditor.prototype.unselectElements = function(){

   for ( var i = 0; i < this.selectedElements.length; i++ ){
      var accordionElement = $("#accordionElement_"+this.selectedElements[i])
      accordionElement.removeClass("selected")
   }
   
   this.selectedElements = []
}

//--------------------------------------------------------------------------//

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
// Refresh
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



//========================================================================================================================//
//SIMPLE - all zooms
//========================================================================================================================//


StyleEditor.prototype.BuildSimpleWidget = function(){

   //--------------------------------------------------------------//

   var uid = this.selectedGroup ? this.selectedGroup.elements[0].uid : this.currentLayerId

   //--------------------------------------------------------------//
   
   var me = this;
   this.widgetDiv.empty();
   this.widgetDiv.css("width", "400px");
   this.widgetDiv.append("<div class='row-fluid' id='widgetDivHeader'></div>");

   //--------------------------------------------------------------//

   if(!this.selectedGroup){
      var openMediumButton = $("<i class='icon-zoom-in icon-white touchable detailLevelButton'></i>");
      openMediumButton.click(function() {
         me.size = StyleEditor.FULL;
         me.refresh();
      });
      
      openMediumButton.appendTo($("#widgetDivHeader"));
   }
   
   this.buildSimpleContent(uid)
}

//--------------------------------------------------------------------------//

StyleEditor.prototype.buildSimpleContent = function(uid){

   //--------------------------------------------------------------//

   this.AddSimpleWidgetRow(uid, this.accordionElements[uid].surname, true);

   //--------------------------------------------------------------//

   try{
      var casing = { name : this.accordionElements[uid].casing }
      var casingUID = this.getUID(casing);

      var center = { name : this.accordionElements[uid].center }
      var centerUID = this.getUID(center);
      
      if ( casingUID ){
         this.AddSimpleWidgetRow(casingUID, "casing");
      }

      if ( centerUID ){
         this.AddSimpleWidgetRow(centerUID, "center");
      }    
   }
   catch(e){}

   //--------------------------------------------------------------//   
}

//--------------------------------------------------------------------------//

StyleEditor.prototype.AddSimpleWidgetRow = function(uid, title, isMain){

   //--------------------------------------------------------------//

   var rule = this.selectedGroup ? this.getFirstRule(uid) : this.getRuleForCurrentZoom(uid)

   var container = $("<div class='row-fluid'></div>");
   container.appendTo($("#widgetDivHeader"))

   //--------------------------------------------------------------//

   $("<div class='span4'><p class='styleEditor_menu_par_"+(isMain ? "title" : "subrow")+"'>" + (isMain && this.selectedGroup ? this.selectedGroup.surname : title) + "</p></div>").appendTo(container);

   //--------------------------------------------------------------//

   if(rule){
      for( var p = 0 ; p < Symbolizer.params[rule["rt"]].length ; p++){  // this is read from a list of known params.
         var property = Symbolizer.getParamName(rule["rt"], p);
         if(property == "alpha" || property == "fill" || property == "stroke")
            this.AddItem(uid, rule, property, container)
      }  
   }

   //--------------------------------------------------------------//

   else{
      $("<div class='span4 offset1'><p class='styleEditor_menu_par_subrow'>(Not in zoom "+this.mapView.context.zoom+")</p></div>").appendTo(container);
   }

}



//========================================================================================================================//
//FULL - zoomGroup
//========================================================================================================================//


StyleEditor.prototype.BuildFullWidget = function(){

   //--------------------------------------------------------------//

   var uid = this.currentLayerId
   
   var me = this;
   this.widgetDiv.empty();
   this.widgetDiv.css("width", "410px");

   //--------------------------------------------------------------//
   // ? never ?

   if ( this.style.content[uid] == undefined ){
      if(this.debug)console.log( uid + " not in style");
      return;
   }

   //--------------------------------------------------------------//

   this.widgetDiv.append("<div id='widgetDivHeader' class='row-fluid'></div>");
   this.widgetDivHeader = $("#widgetDivHeader")

   //--------------------------------------------------------------//

   var openSmallestButton = $("<i class='icon-zoom-out icon-white touchable detailLevelButton'></i>");
   openSmallestButton.click(function() {
      me.size = StyleEditor.SIMPLE;
      me.refresh();
   });

   openSmallestButton.appendTo(this.widgetDivHeader);

   //--------------------------------------------------------------//

   this.BuildZoomGroupsSelector(uid);

   //--------------------------------------------------------------//
}


StyleEditor.prototype.BuildZoomGroupsSelector = function(uid){

   //-----------------------------------------------------//

   this.gatherRulesByZoom(uid)

   //-----------------------------------------------------//
   // template selectbox

   this.widgetDivHeader = $("#widgetDivHeader")
   
   var div = "<div class='row-fluid marginbottom'>";
   div = "<div class='span5 offset1'><select class='shaderSelectbox' name='ruleSelector' id='ruleSelector'>";

   for( var i = 0 ; i < this.zoomGroups.length; i++){
      var label = this.getZoomGroupLabel(this.zoomGroups[i])
      div += "<option value='"+i+"'>"+label+"</option>"
   }

   div += "</select></div>";

   div += "<div class='span1 offset1'><button class='btn-small btn-success' onclick='$(window).trigger(MaperialEvents.EDIT_ZOOMS)'><i class='icon-edit icon-white'></i></button></div>";

   div += "</div>";

   this.widgetDivHeader.append(div);

   //-----------------------------------------------------//

   this.widgetDiv.append("<div class='row-fluid' id='widgetDivContent'></div>");

   //-----------------------------------------------------//
   // build selectbox

   var me = this
   $("#ruleSelector").selectbox({
      onChange: function(uid){
         return function (val,  inst) {
            me.changeWidgetContent(inst,uid)
         }
      }(uid),
      effect: "slide"
   });

   // init selectbox value
   $("#ruleSelector").selectbox('change', "", this.getZoomGroupLabel(this.zoomGroups[0]));
}


//----------------------------------------------------------------------------------------//

StyleEditor.prototype.changeWidgetContent = function(selection, uid){

   //-------------------------------------------//

   this.selectedZoomGroup  = this.zoomGroups[selection.input[0]["value"]]
   this.refreshZoomSelection()
   $("#widgetDivContent").empty()

   //-------------------------------------------//

   this.buildFullRule(this.selectedZoomGroup.rule, uid, this.accordionElements[uid].surname)

   if(this.selectedZoomGroup.casingRule)
      this.buildFullRule(this.selectedZoomGroup.casingRule, this.selectedZoomGroup.casingUID, "casing");

   if(this.selectedZoomGroup.centerRule)
      this.buildFullRule(this.selectedZoomGroup.centerRule, this.selectedZoomGroup.centerUID, "center");

   //-------------------------------------------//
}

//----------------------------------------------------------------------------------------//

StyleEditor.prototype.buildFullRule = function(rule, uid, title){

   $("<hr/><div class='span4'><p class='sublayerPartTitle'>" + title + "</p></div>").appendTo($("#widgetDivContent"));

   //-------------------------------------------//

   var propertyGroups = {"color" : [], "details" : [], "size" : []}

   for( var p = 0 ; p < Symbolizer.params[rule["rt"]].length ; p++){  // this is read from a list of known params. 
      var property = Symbolizer.getParamName(rule["rt"], p);

      switch(property){
         case "stroke": 
         case "fill": 
         case "alpha": 
            propertyGroups["color"].push(property)
            break

         case "linejoin": 
         case "linecap": 
            propertyGroups["details"].push(property)
            break
            
         case "width": 
            propertyGroups["size"].push(property)
            break
      }
   }

   //--------------------------------------------------------------//

   for(var group in propertyGroups){
      var properties = propertyGroups[group]
      if(properties.length == 0)
         continue;

      var container = $("<div class='row-fluid marginbottom'></div>");
      container.appendTo($("#widgetDivContent"))

      for(var i = 0; i< properties.length; i++ ){
         this.AddItem(uid, rule, properties[i], container)
      }
   }   
}

//========================================================================================================================//

StyleEditor.prototype.AddItem = function(uid, rule, property, container){
   
   var value = this.getValue(uid, rule["id"], property);   
   
   if ( value === undefined ){
      value = Symbolizer.defaultValues[property];
   }

   if ( property == "width" ){  
      this.AddSlider(property, value, uid, rule["id"], container, 1, 1, 10);
   }
   else if ( property == "fill" || property == "stroke" ){
      this.AddColorPicker(property, value, uid, rule["id"], container);
   }
   else if ( property == "alpha" ){
      this.AddSlider(property, value, uid, rule["id"], container, 0.05, 0, 1);
   }
   else if ( property == "linejoin" ){
      this.AddCombo(property, value, uid, rule["id"], container, Symbolizer.combos["linejoin"]);
   }  
   else if ( property == "linecap" ){
      this.AddCombo(property, value, uid, rule["id"], container, Symbolizer.combos["linecap"]);
   }  
   else{
      console.log(property + " (not implemented yet) : " + value )
   }
}



//========================================================================================================================//
//Items
//========================================================================================================================//



StyleEditor.prototype.AddColorPicker = function(_property,_value,_uid,_ruleId,_container){
   var id = "styleEditor_menu_colorpicker_" + _property + "_" + _ruleId
   // add to view
   $("<div class='span2'><div class='colorSelector' id='" + id + "'><div style='background-color:" + ColorTools.RGBAToHex(_value) + "'></div></div></div>").appendTo(_container);

   // plug callback
   $("#"+id).ColorPicker({
      color: ColorTools.RGBAToHex(_value),   // set initial value
      onShow: function (colpkr) {
         $(colpkr).fadeIn(500);
         return false;
      },
      onHide: function (colpkr) {
         $(colpkr).fadeOut(500);
         return false;
      },
      onChange: this.ColorPickerChange(_ruleId,_property),
      onSubmit: this.ColorPickerSubmit(_uid,_ruleId,_property),
   });
}

//----------------------------------------------------------------------------------------------------------------------//

StyleEditor.prototype.AddSlider = function(_property,_value,_uid,_ruleId,_container,_step,_min,_max){

   var me = this;
   // add to view
   $( "<div class='span5 widgetSlider'>" + _property + " : " +"<div class='styleEditorSlider' id='styleEditorSlider_" + _property + "_" + _ruleId + "'></div>").appendTo(_container);

   // set callback
   $( "#styleEditorSlider_"+_property+"_"+_ruleId ).slider({
      range: false,
      min: _min,
      max: _max,
      step: _step,
      value: _value,
      stop: this.GetSliderCallBack(_uid,_ruleId,_property),
   });

   // set initial value
   $( "#styleEditorSlider_"+_property+"_"+_ruleId ).slider("value" , _value);

   Utils.buildSliderStyle("styleEditorSlider_"+_property+"_"+_ruleId);
}

//----------------------------------------------------------------------------------------------------------------------//

StyleEditor.prototype.AddCombo = function(property, value, uid, ruleId, container, values){
   
   //----------------------------------------------//

   var id = "styleEditor_menu_select_" + property + "_" + ruleId
   $( "<div class='span2'><p>" + property + " : " +"</p></div><div class='span4'><select id='" + id + "' class='shaderSelectbox' name="+id+" ></div>").appendTo(container);

   //----------------------------------------------//

   // set option list
   for( var v = 0 ; v < values.length ; v++){
      $("#"+id).append("<option value='" + values[v] + "'> " + values[v] + "</option>");
   }

   // start value
   $("#"+id).val(value);
   
   //----------------------------------------------//

   var me = this
   $("#"+id).selectbox({
      onChange: function(uid,ruleId,property){
         return function (val,  inst) {
            me.changeProperty(uid, property, val);
         }
      }(uid, ruleId, property),
      effect: "slide"
   });

   //----------------------------------------------//

}

//----------------------------------------------------------------------------------------------------------------------//

//Closure for colorpicker callback
StyleEditor.prototype.ColorPickerChange = function(_ruleId,property){
   return function (hsb, hex, rgb) {
      $("#styleEditor_menu_colorpicker_"+property+"_"+_ruleId +" div").css('backgroundColor', '#' + hex);
   }
}

StyleEditor.prototype.ColorPickerSubmit = function(_uid,_ruleId,property){
   var me = this;
   return function (hsb, hex, rgb) {
      me.changeProperty(_uid, property, ColorTools.HexToRGBA(hex));
   }
}

//----------------------------------------------------------------------------------------------------------------------//

//Closure for slider callback
StyleEditor.prototype.GetSliderCallBack = function(_uid,_ruleId,property){  
   var me = this;

   return function (event, ui) {
      var newV = ui.value;
      me.changeProperty(_uid,property,newV);
   }
};

//----------------------------------------------------------------------------------------------------------------------//

//upgrade jquery checkboxes
(function($)  {
   $.fn.extend({
      check : function()  {
         return this.filter(":radio, :checkbox").attr("checked", true);
      },
      uncheck : function()  {
         return this.filter(":radio, :checkbox").removeAttr("checked");
      },
      disable : function()  {
         return this.filter(":radio, :checkbox").attr("disabled", true);
      },
      enable : function()  {
         return this.filter(":radio, :checkbox").removeAttr("disabled");
      }
   });
}(jQuery));