//----------------------------------------------------------------------------------------//

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

//----------------------------------------------------------------------------------------//

//upgrade Object prototype
Object.size = function(obj) {
   var size = 0, key;
   for (key in obj) {
      if (obj.hasOwnProperty(key)) size++;
   }
   return size;
};

//==================================================================//
//StyleMenu
///@todo define a xsmall small standard large xlarge size for each element and each zoom level
//==================================================================//

StyleMenu.SMALLEST = 1;
StyleMenu.MEDIUM = 2;
StyleMenu.BIGGEST = 3;

//==================================================================//

function StyleMenu(container, container2, container3, mapView){

   console.log("  building style menu...");

   //-------------------------------------------------//
   
   this.mapView = mapView;
   this.style = this.mapView.stylesManager.getSelectedStyle();
   
   //-------------------------------------------------//

   this.size               = StyleMenu.SMALLEST;
   this.currentLayerId     = "001"; // layer.sublayer
   this.currentLayerIndex  = 0;     // map.layer
   
   //-------------------------------------------------//
   //id <-> name/filter mapping
   this.mappingArray = Array();

   //-------------------------------------------------//
   //groups of layer (roads, urban, landscape, ...)
   this.groups = null; 

   //-------------------------------------------------//
   //the mapping (json)
   this.mapping = null; // link id (in style) with a "real" name & filter

   //-------------------------------------------------//
   //current zooms
   this.selectedZooms = []
   this.currentZmin = 0;
   this.currentZmax = 18;

   //-------------------------------------------------//
   //parent div
   this.styleMenuParentEl = container;
   this.styleMenuParentEl2 = container2;
   this.styleMenuParentEl3 = container3;
   this.mainDiv = null;
   this.widgetDiv = null;
   this.zoomDiv = null;

   //-------------------------------------------------//
   //current element id
   this.currentUid = null;
   this.currentGroup = null;
   this.currentName = null;

   //-------------------------------------------------//

   this.debug = false;

   //-------------------------------------------------//
   
   this.Load(); // will call LoadMapping and then LoadStyle ...
   
   this.initListeners();
   
   // style edition default 
   this.ChangeSelectedSubLayer(this.currentLayerIndex, this.currentLayerId);
}

//==================================================================//

StyleMenu.prototype.initListeners = function (event) {
   
   var styleMenu = this;
   
   $(window).on(MaperialEvents.OPEN_STYLE, function(event, layerIndex, layerId){
      styleMenu.ChangeSelectedSubLayer(layerIndex, layerId)
   });
   
   $(window).on(MaperialEvents.OPEN_ZOOMS, function(event){
//      styleMenu.mapView.hud.panel(HUD.ZOOMS).reveal();
      styleMenu.showZoomGroupEdition()
   });

   $(window).on(MaperialEvents.ZOOM_TO_REFRESH, function(event, map, viewTriggering, typeTriggering, zoom){
      if(viewTriggering == styleMenu.mapView.name)
         styleMenu.highlightCurrentZoom()
   });

   this.mapView.context.mapCanvas.on(MaperialEvents.MOUSE_DOWN, function(){
      $(".colorpicker").hide();
   });
}

StyleMenu.prototype.removeListeners = function (event) {
   $(window).off(MaperialEvents.OPEN_STYLE);
   $(window).off(MaperialEvents.OPEN_ZOOMS);
   this.mapView.context.mapCanvas.off(MaperialEvents.MOUSE_DOWN)
}

//==================================================================//

StyleMenu.prototype.showZoomGroupEdition = function(){
   this.container = $("#"+this.mapView.name);

   var html = "<div id='menuZoomGroupEdition' class='reveal-modal'><h2>Edit zoom selection</h2>"
   
//   if(this.zoomGroups.length == 1){
//     
//   }
   
   html +=  "<div class='row-fluid'><div class='span3 offset2 btn-primary btn-large touchable '>Merge left keep</div><div class='span3 offset2 btn-large btn-primary touchable'>Merge right keep</div></div>"
   html +=  "<div class='row-fluid'><div class='span3 offset2 btn-large btn-primary touchable'>Merge left take</div><div class='span3 offset2 btn-large btn-primary touchable'>Merge right take</div></div>"
   html +=  "<div class='row-fluid'><div class='span4 offset4 btn-large btn-primary touchable'>Split</div></div>"

   html +=  "<a class='close-reveal-modal'>&#215;</a></div>"
      
       
   this.container.append(html);
   
   $("#menuZoomGroupEdition").reveal();
}

//==================================================================//

StyleMenu.prototype.Refresh = function(){
   $(window).trigger(MaperialEvents.STYLE_CHANGED, [this.mapView.name, this.currentLayerIndex]);
}

StyleMenu.prototype.SetParam = function(luid,rule,param,value){
   var def = 0
   if ( this.style.content[luid] == undefined ){
      if(this.debug)console.log( luid + " not in style");
      return false;
   }
   
   var ok = false;
   for( var p = 0 ; p < Object.size(this.style.content[luid]["s"][rule]["s"][def] ) ; p++){ // params
      var paramName = Symbolizer.getParamName(this.style.content[luid]["s"][rule]["s"][def]["rt"],p);
      if ( paramName == param ){
         this.style.content[luid]["s"][rule]["s"][def][paramName] = value;
         var zmin = this.style.content[luid]["s"][rule]["zmin"];
         //if(this.debug)console.log("changing for z " + zmin);
         ok = true;
         break;
      }
   }
   if ( !ok ){
      //if(this.debug)console.log(" not found , adding!" , luid , rule, def , param);
      this.style.content[luid]["s"][rule]["s"][def][param] = value;
   }

   this.Refresh();
   return ok;
}


StyleMenu.prototype.SetParamId = function(luid,ruid,param,value){
   if ( this.style.content[luid] == undefined ){
      if(this.debug)console.log( luid + " not in style");
      return false;
   }
   for(var rule = 0 ; rule < Object.size(this.style.content[luid]["s"]) ; rule++){
      for( var d = 0 ; Object.size(this.style.content[luid]["s"][rule]["s"]) ; d++){ //def
         if( this.style.content[luid]["s"][rule]["s"][d]["id"] == ruid ){
            for( var p = 0 ; p < Object.size(this.style.content[luid]["s"][rule]["s"][d] ) ; p++){ //params
               var paramName = Symbolizer.getParamName(this.style.content[luid]["s"][rule]["s"][d]["rt"],p);
               if ( paramName == param ){
                  this.style.content[luid]["s"][rule]["s"][d][paramName] = value;

                  this.Refresh();
                  return true;
               }
            }
            //if(this.debug)console.log(" not found , adding!" , luid , ruid , param);
            this.style.content[luid]["s"][rule]["s"][d][param] = value;

            this.Refresh();
            return true;
         }
      }
   }
   if(this.debug)console.log(" not found !" , luid , ruid , param);
   return false;
}


StyleMenu.prototype.SetParamIdZNew = function(luid,param,value){
      
   console.log("SetParamIdZNew", luid, param, value)
   
   if ( this.style.content[luid] == undefined ){
      if(this.debug)console.log( luid + " not in style");
      return false;
   }

   var rules   = this.style.content[luid]["s"]
   var nbRules = rules.length

   for(var i = 0 ; i < nbRules; i++){
      var z = rules[i]["zmin"];

      if ( this.selectedZooms[z] ){
         this.SetParam(luid,i,param,value);
      }
   }
   return true;
}


StyleMenu.prototype.GetParamId = function(luid,ruid,param){
   if ( this.style.content[luid] == undefined ){
      if(this.debug)console.log(luid + " not in style");
      return undefined;
   }
   for(var rule = 0 ; rule < Object.size(this.style.content[luid]["s"]) ; rule++){
      for( var d = 0 ; d < Object.size(this.style.content[luid]["s"][rule]["s"]) ; d++){ //def
         if ( this.style.content[luid]["s"][rule]["s"][d]["id"] == ruid ){
            for ( var p = 0 ; p < Object.size(this.style.content[luid]["s"][rule]["s"][d] ); p++){ //params
               var paramName = Symbolizer.getParamName(this.style.content[luid]["s"][rule]["s"][d]["rt"],p);
               if ( paramName == param ){
                  return this.style.content[luid]["s"][rule]["s"][d][paramName];
               }
            }
            //if(this.debug)console.log(" not found , adding!" , luid , ruid , param);
            //this.style.content[luid]["s"][rule]["s"][d][param] = Symbolizer.defaultValues[param];           
            //return this.style.content[luid]["s"][rule]["s"][d][param]; 
         }
      }
   }
   //if(this.debug)console.log(" not found !", luid , ruid, param);
   return undefined;
}

//=================================================================================================================//

//the main function
StyleMenu.prototype.Load = function(){
   this.LoadGroup();
}


StyleMenu.prototype.ReLoad = function(){
   this.BuildElements();
}


//AJaX load group
StyleMenu.prototype.LoadGroup = function(){
   if(this.debug)console.log("Loading groups");
   var me = this;
   $.ajax({
      url: Maperial.staticURL+'/style/group3.json',
      async: false,
      dataType: 'json',
      //contentType:"application/x-javascript",
      success: function (data) {
         me.groups = data;
         me.LoadMapping();
      },
      error: function (){
         if(me.debug)console.log("Loading group failed");
      }
   });
}


StyleMenu.prototype.__LoadMapping = function(){
   if(this.debug)console.log("##### MAPPING ####");
   for(var entrie = 0 ; entrie < Object.size(this.mapping) ; entrie++){
      //if(this.debug)console.log(this.mapping[entrie]["name"]);
      // build mappingArray object
      for( var layer = 0 ; layer < Object.size(this.mapping[entrie]["layers"]) ; layer++){
         //if(this.debug)console.log("    filter : " + this.mapping[entrie]["layers"][layer]["filter"]);
         //if(this.debug)console.log("    uid : " + this.mapping[entrie]["layers"][layer]["id"]);
         this.mappingArray[ this.mapping[entrie]["layers"][layer]["id"] ] = { name : this.mapping[entrie]["name"] , filter : this.mapping[entrie]["layers"][layer]["filter"]};
      }
   }
   this.BuildElements();  
}


StyleMenu.prototype.GetUids = function(name){
   var ids = Array();
   if ( name == "none" ){
      return ids;
   }
   for(var entrie = 0 ; entrie < Object.size(this.mapping) ; entrie++){
      if ( this.mapping[entrie]["name"] == name){
         for( var layer = 0 ; layer < Object.size(this.mapping[entrie]["layers"]) ; layer++){
            ids.push(this.mapping[entrie]["layers"][layer]["id"]);
         }
      }
   }
   return ids;
}


StyleMenu.prototype.GetUid = function(name,filter){
   for(var entrie = 0 ; entrie < Object.size(this.mapping) ; entrie++){
      if ( this.mapping[entrie]["name"] == name){
         for( var layer = 0 ; layer < Object.size(this.mapping[entrie]["layers"]) ; layer++){
            if ( this.mapping[entrie]["layers"][layer]["filter"] == filter ){
               return this.mapping[entrie]["layers"][layer]["id"];
            }
         }
      }
   }
   return null;
}


//AJaX load mapping
StyleMenu.prototype.LoadMapping = function(){
   if(this.debug)console.log("Loading mapping");
   var me = this;

   $.ajax({
      url: Maperial.staticURL+'/style/mapping.json',
      async: false,
      dataType: 'json',
      //contentType:"application/x-javascript",
      success: function (data) {
         me.mapping = data;
         me.__LoadMapping();
      },
      error: function (){
         if(me.debug)console.log("Loading mapping failed");
      }
   });
}

//========================================================================================================================================//

//Dirty version ... draw view on the fly ...
StyleMenu.prototype.BuildElements = function(){

   this.styleMenuParentEl.empty();   
   this.styleMenuParentEl2.empty();   
   this.styleMenuParentEl3.empty();   

   this.styleMenuParentEl.hide(); // hide me during loading

   this.mainDiv = $('<div id="styleMenu_menu_maindiv'+this.mapView.name+'" class="styleMenu_menu_maindiv"></div>');
   this.mainDiv.appendTo(this.styleMenuParentEl);

   this.widgetDiv = $('<div id="styleMenu_menu_widgetDiv'+this.mapView.name+'" class="styleMenu_menu_widgetDiv"></div>');
   this.widgetDiv.appendTo(this.styleMenuParentEl2);

   this.zoomDiv = $('<div id="styleMenu_menu_zoomDiv'+this.mapView.name+'" class="styleMenu_menu_zoomDiv" ></div>');
   this.zoomDiv.appendTo(this.styleMenuParentEl3);

   //this.__FillZoomDef();
   this.__InsertZoomEdition();
   this.__InsertZoomEdition2();
   this.__InsertAccordion();
}  

//========================================================================================================================================//

StyleMenu.prototype.resetEnabledZooms = function(){

   this.enableZooms  = []
   var rules         = this.style.content[this.currentLayerId]["s"]
   var nbRules       = rules.length
   var min           = rules[0]["zmin"]
   var max           = rules[nbRules-1]["zmin"]
   
   for(var i = 0 ; i < nbRules; i++){
      var zmin = rules[i]["zmin"]
      this.enableZooms[zmin] = true
      this.selectedZooms[zmin] = true
   }

   for(var z = 0 ; z < 19 ; z++){
      if ( z >= min && z <= max)
         $("#styleMenu_menu_zcheck" + z ).enable();
      else
         $("#styleMenu_menu_zcheck" + z ).disable();
   }


   $( "#styleMenu_menu_sliderrangez" ).slider({
      min: min,
      max: max
   })
   
   $( "#styleMenu_menu_sliderrangez" ).css("width", ((max-min+1)*30)+"px");
   $( "#styleMenu_menu_sliderrangez" ).css("margin-left", (30 + min*33)+"px");
   
   this.highlightCurrentZoom()
}

//----------------------------------------------------------------------------------------------------------------------//

StyleMenu.prototype.highlightCurrentZoom = function(){
   for ( var z = 0 ; z < 19 ; ++z){
      if(z == this.mapView.GetZoom())
         $("#styleMenu_menu_zcheck"+z+"_label").css("border", "4px solid  #45f");
      else
         $("#styleMenu_menu_zcheck"+z+"_label").css("border", "1px solid");
   }
}

//----------------------------------------------------------------------------------------------------------------------//

StyleMenu.prototype.refreshZoomSelection = function(min, max){
   console.log("------------ refreshZoomSelection", min, max)

   this.currentZmin = min;
   this.currentZmax = max;
   
   for(var z = 0 ; z < 19 ; z++){
      if ( z >= min && z <= max){
         $("#styleMenu_menu_zcheck" + z ).check();
         this.selectedZooms[z] = true
      }
      else{
         $("#styleMenu_menu_zcheck" + z ).uncheck();
         this.selectedZooms[z] = false
      }
      
      $("#styleMenu_menu_zcheck" + z ).button("refresh");
   }

   $( "#styleMenu_menu_sliderrangez" ).slider( "values",  [this.currentZmin, this.currentZmax] );  
}


//StyleMenu.prototype.updateSelectedZooms = function(){
//   console.log("------------ updateSelectedZooms ", this.currentLayerId)
//   
//   this.selectedZooms = [];
//   for ( var z = 0 ; z < 19 ; ++z){
//      if ( $("#styleMenu_menu_zcheck" + z).is(":checked") ){
//         this.selectedZooms.push(z);    
//      }
//   } 
//}

//----------------------------------------------------------------------------------------------------------------------//

StyleMenu.prototype.__InsertZoomEdition = function(){
   $("#styleMenu_menu_rlbutton").button();
   $("#styleMenu_menu_zbuttonminus").button();
   $("#styleMenu_menu_zbuttonplus").button();
}

StyleMenu.prototype.__InsertZoomEdition2 = function(){

   var me = this;
   var tmpcb = '';
   for ( var z = 0 ; z < 19 ; z++){
      tmpcb += '  <input type="checkbox" class="styleMenu_menu_checkboxz" id="styleMenu_menu_zcheck' + z + '"/><label id="styleMenu_menu_zcheck' + z + '_label" class="zoom-button" for="styleMenu_menu_zcheck' + z + '">' + z + '</label>';
   }    

   $('<h2 class="styleMenu_menu_par_title_z"> Edit some zoom</h2><div id="styleMenu_menu_zoom_selector">' +  tmpcb + '</div>' ).appendTo(this.zoomDiv);//.hide();
   $('<h2 class="styleMenu_menu_par_title_z"> Edit a zoom range</h2><div id="styleMenu_menu_sliderrangez"></div><br/>').appendTo(this.zoomDiv);

   for ( var z = 0 ; z < 19 ; z++){
      $("#styleMenu_menu_zcheck"+z).change(function(zoom){
         return function(){
            console.log("changing styleMenu_menu_zcheck"+zoom)
            me.selectedZooms[zoom] = !me.selectedZooms[zoom] 
         }
      }(z));
   }

   $( "#styleMenu_menu_zoom_selector" ).buttonset();

   $( "#styleMenu_menu_sliderrangez" ).slider({
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
//         me.refreshZoomSelection(min, max) -- TODO : refreshzoom EDition : creation d'un zoomGroup ici !
      }
   });

//   $( "#styleMenu_menu_sliderrangez" ).slider( "values",  [this.currentZmin, this.currentZmax+1] );

   Utils.buildSliderStyle("styleMenu_menu_sliderrangez");

}


//in the next callback "_ruleId" is the *caller* rule id.
//but thanks to SetParamIdZNew we are updating many zooms at the same time


//----------------------------------------------------------------------------------------------------------------------//

//Closure for colorpicker callback
StyleMenu.prototype.ColorPickerChange = function(_ruleId,pName){
   return function (hsb, hex, rgb) {
      $("#styleMenu_menu_colorpicker_"+_ruleId +" div").css('backgroundColor', '#' + hex);
   }
}

StyleMenu.prototype.ColorPickerSubmit = function(_uid,_ruleId,pName){
   var me = this;
   return function (hsb, hex, rgb) {
      var linkedUIDs = me.linkedUIDs(_uid);
      for(var i = 0 ; i < linkedUIDs.length; i++)
         me.SetParamIdZNew(linkedUIDs[i], pName, ColorTools.HexToRGBA(hex));
   }
}

//----------------------------------------------------------------------------------------------------------------------//

//Closure for spinner callback
StyleMenu.prototype.GetSpinnerCallBack = function(_uid,_ruleId,pName){  
   var me = this;
   return function (event, ui) {
      var newV = ui.value;
      me.SetParamIdZNew(_uid,pName,newV);
   }
}


//Closure for slider callback
StyleMenu.prototype.GetSliderCallBack = function(_uid,_ruleId,pName){  
   var me = this;

   return function (event, ui) {
      var newV = ui.value;
      me.SetParamIdZNew(_uid,pName,newV);
   }
}

//----------------------------------------------------------------------------------------------------------------------//

//Closure for select callback
StyleMenu.prototype.GetSelectCallBack = function(_uid,_ruleId,_pName){
   var me = this;
   return function (){
      var newV = $("#styleMenu_menu_select_" + _pName + "_" + _ruleId + " option:selected").text();
      me.SetParamIdZNew(_uid,_pName,newV);
      ///@todo bug ... seems to work only once ...
   }
}


//Closure for checkbox callback
StyleMenu.prototype.GetCheckBoxCallBack = function(_uid){
   var me = this;
   return function() {
      var vis = $("#styleMenu_menu_check_" + _uid + ":checked").val()?true:false;
      me.style[_uid]["visible"] = vis;               ///@todo this is not in a "set" function ... I don't like that !!!

      var gn = me.GetGroupNameFilterFromLayerId(_uid);

      var childs = Array();
      if ( this.groups[gn.group][gn.name].type == "line" ){
         var casing = me.groups[gn.group][gn.name].casing;
         var center = me.groups[gn.group][gn.name].center;
         //if(this.debug)console.log(casing,center);
         childs = childs.concat( me.GetUids(casing) );
         childs = childs.concat( me.GetUids(center) );
      }
      else if (this.groups[gn.group][gn.name].type == "poly"){
         childs = childs.concat( me.GetUids(me.groups[gn.group][gn.name].line) );
      } 
      else{
         ///@todo
      }

      for (var i = 0 ; i < childs.length ; i++){
         var uid = childs[i];
         if ( me.mappingArray[uid].filter == this.mappingArray[_uid].filter ){
            me.style[uid]["visible"] = vis;               ///@todo this is not in a "set" function ... I don't like that !!!
         }
      } 

      me.Refresh();
      //if(me.debug)console.log( _uid, "visible",  vis );
   }
}; 

//----------------------------------------------------------------------------------------------------------------------//

StyleMenu.prototype.AddColorPicker = function(_paramName,_paramValue,_uid,_ruleId,_container){
   // add to view
//   $("<li>" + _paramName + " : " + "<div class='colorSelector ' id='styleMenu_menu_colorpicker_" + _ruleId + "'><div style='background-color:" + ColorTools.RGBAToHex(_paramValue) + "'></div></div> </li>").appendTo(_container);
   $("<div class='colorSelector ' id='styleMenu_menu_colorpicker_" + _ruleId + "'><div style='background-color:" + ColorTools.RGBAToHex(_paramValue) + "'></div></div>").appendTo(_container);

   // plug callback
   $("#styleMenu_menu_colorpicker_"+_ruleId).ColorPicker({
      color: ColorTools.RGBAToHex(_paramValue),   // set initial value
      onShow: function (colpkr) {
         $(colpkr).fadeIn(500);
         return false;
      },
      onHide: function (colpkr) {
         $(colpkr).fadeOut(500);
         return false;
      },
      onChange: this.ColorPickerChange(_ruleId,_paramName),
      onSubmit: this.ColorPickerSubmit(_uid,_ruleId,_paramName),
   });
}

//----------------------------------------------------------------------------------------------------------------------//

StyleMenu.prototype.AddSpinner = function(_paramName,_paramValue,_uid,_ruleId,_container,_step,_min,_max){
   // add to view
   $( "<li>" + _paramName + " : " +"<input class='styleMenu_menu_spinner' id='styleMenu_menu_spinner_" + _paramName + "_" + _ruleId + "'></li>").appendTo(_container);

   // set callback
   $( "#styleMenu_menu_spinner_"+_paramName+"_"+_ruleId ).spinner({
      //change: GetSpinnerCallBack(uid,ruleId,_paramName),
      spin: this.GetSpinnerCallBack(_uid,_ruleId,_paramName),
      step: _step,
      min : _min,
      max : _max,
   });

   // set initial value    
   $( "#styleMenu_menu_spinner_"+_paramName+"_"+_ruleId ).spinner("value" , _paramValue);  
}

//----------------------------------------------------------------------------------------------------------------------//

StyleMenu.prototype.AddSlider = function(_paramName,_paramValue,_uid,_ruleId,_container,_step,_min,_max){
   
   var me = this;
   // add to view
   $( "<li>" + _paramName + " : " +"<div class='styleMenu_menu_slider' id='styleMenu_menu_slider_" + _paramName + "_" + _ruleId + "'></li>").appendTo(_container);

   // set callback
   $( "#styleMenu_menu_slider_"+_paramName+"_"+_ruleId ).slider({
      range: false,
      min: _min,
      max: _max,
      step: _step,
      value: _paramValue,
      stop: this.GetSliderCallBack(_uid,_ruleId,_paramName),
   });

   // set initial value
   $( "#styleMenu_menu_slider_"+_paramName+"_"+_ruleId ).slider("value" , _paramValue);
}

//----------------------------------------------------------------------------------------------------------------------//

StyleMenu.prototype.AddCombo = function(_paramName,_paramValue,_uid,_ruleId,_container,_values){
   // add to view
   $( "<li>" + _paramName + " : " +"<select id='styleMenu_menu_select_" + _paramName + "_" + _ruleId + "'></li>").appendTo(_container);
   // add options
   for( var v = 0 ; v < Object.size(_values) ; v++){
      $("#styleMenu_menu_select_" + _paramName + "_" + _ruleId).append("<option value='" + _values[v] + "'> " + _values[v] + "</option>");
   }
   // set value
   $("#styleMenu_menu_select_" + _paramName + "_" + _ruleId).val(_paramValue);
   // set callback
   $("#styleMenu_menu_select_" + _paramName + "_" + _ruleId).change(this.GetSelectCallBack(_uid,_ruleId,_paramName));
}

//----------------------------------------------------------------------------------------------------------------------//

StyleMenu.prototype.Accordion = function(_group,_name,uid){

   if ( this.style.content[uid]["s"].length < 1 ){
      if(this.debug)console.log("Error : empty style " + uid );
      return;
   }

   var groupNum = 0;
   for ( var group in this.groups ){ // for all groups of element
      if (!this.groups.hasOwnProperty(group)) {
         continue;
      }
      if ( group == _group){
         break;
      }
      groupNum++;
   }
   n = $("#styleMenu_menu_groupaccordion_div_group_"+groupNum+" h2").index($("#styleMenu_menu_headeraccordion_" + uid));
   //console.log($("#styleMenu_menu_groupaccordion_div_group_"+groupNum+" h2"));
   //console.log(n);
   $("#styleMenu_menu_accordion").accordion("option", "active", groupNum);
   $("#styleMenu_menu_groupaccordion_div_group_" + groupNum).accordion("option", "active", n);
}

//----------------------------------------------------------------------------------------------------------------------//

StyleMenu.prototype.filterName = function(group,name,uid){
   
   if ( this.groups[group][name].hasOwnProperty("alias") ){
      
      for ( var al in this.groups[group][name]["alias"] ){
         var fal = this.groups[group][name]["alias"][al];
         if ( this.mappingArray[uid].filter.indexOf(fal) >= 0 ){
            if(this.debug)console.log( fal + " is in " + this.mappingArray[uid].filter );
            return al;
         }
      }
   }
   
   return this.mappingArray[uid].filter;
}

//------------------------------------------------------------------//

StyleMenu.prototype.gatherRulesByZoom = function(uid){
   console.log("Gather rules")
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
         this.zoomGroups.push({zmin:start, zmax : end, rule:currentRule})
         currentRule = nextRule
         start       = rules[i].zmin
         end         = rules[i].zmin
         endWithNewRule = true
      }
   }

   if(!endWithNewRule){
      this.zoomGroups.push({zmin:start, zmax : end, rule:currentRule})
   }
}

//------------------------------------------------------------------//

StyleMenu.prototype.isSameRule = function(rule1, rule2){
  
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

StyleMenu.prototype.changeWidgetContent = function(selection, uid){
   
   var zoomGroup  = this.zoomGroups[selection.input[0]["value"]]
   var rule       = this.zoomGroup.rule
   
   var container = $("#widgetDivContent")
   container.empty()
   
   this.refreshZoomSelection(zoomGroup.zmin, zoomGroup.zmax)

   for( var p = 0 ; p < Symbolizer.params[rule["rt"]].length ; p++){  // this is read from a list of known params. 

      var paramName = Symbolizer.getParamName(rule["rt"],p);
      var paramValue = this.GetParamId(uid, rule["id"], paramName);   

      if ( paramValue === undefined ){
         paramValue = Symbolizer.defaultValues[paramName];
      }

      if ( paramName == "width" ){  
         this.AddSlider(paramName, paramValue, uid, rule["id"], container, 0.25, 0, 20);
      }
      else if ( paramName == "fill" || paramName == "stroke" ){
         this.AddColorPicker(paramName, paramValue, uid, rule["id"], container);
      }
      else if ( paramName == "alpha" ){
         this.AddSlider(paramName, paramValue, uid, rule["id"], container, 0.05, 0, 1);
      }
      else if ( paramName == "linejoin" ){
         this.AddCombo(paramName, paramValue, uid, rule["id"], container, Symbolizer.combos["linejoin"]);
      }  
      else if ( paramName == "linecap" ){
         this.AddCombo(paramName, paramValue, uid, rule["id"], container, Symbolizer.combos["linecap"]);
      }  
      else{
         $("<li>" + paramName + "(not implemented yet) : " + paramValue + "</li>").appendTo(container) ; 
      }
   }
}

//------------------------------------------------------------------//

StyleMenu.prototype.getZoomGroupLabel = function(zoomGroup){
   if(zoomGroup.zmin != zoomGroup.zmax)
      return zoomGroup.zmin +" - "+zoomGroup.zmax   
   else
      return zoomGroup.zmin
}

//------------------------------------------------------------------//
   
StyleMenu.prototype.FillWidget = function(uid){

   if ( this.style.content[uid]["s"].length < 1 ){
      if(this.debug)console.log("Error : empty style " + uid );
      return;
   }

   //-----------------------------------------------------//

   this.gatherRulesByZoom(uid)

   //-----------------------------------------------------//
   // template selectbox

   var div = "<div class='row-fluid marginbottom'>";
   div += "<div class='span7 offset1'><select class='shaderSelectbox' name='ruleSelector' id='ruleSelector'>";

   for( var i = 0 ; i < this.zoomGroups.length; i++){
      var label = this.getZoomGroupLabel(this.zoomGroups[i])
      div += "<option value='"+i+"'>"+label+"</option>"
   }

   div += "</select></div>";
   
   div += "<div class='span3 offset1'><button class='btn-small btn-success' onclick='$(window).trigger(MaperialEvents.OPEN_ZOOMS)'><i class='icon-edit icon-white'></i></button></div>";

   div += "</div>";

   this.widgetDiv.append(div);
   this.widgetDiv.append("<div class='row-fluid marginbottom' id='widgetDivContent'></div>");

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
   
StyleMenu.prototype.__BuildWidget = function(group,name,uid){
   
   var me = this;
   if(this.debug)console.log("building widget ",group,name,uid);

   //clear parent div
   this.widgetDiv.empty();
   this.widgetDiv.append("<div id='widgetDivHeader' class='row-fluid marginbottom'></div>");
   this.widgetDivHeader = $("#widgetDivHeader")

   var openSmallestButton = $("<div class='span1'><i class='icon-zoom-out icon-white touchable'></i></div>");
   openSmallestButton.click(function() {
      me.size = StyleMenu.SMALLEST;
      me.refresh();
   });
   
   openSmallestButton.appendTo(this.widgetDivHeader);

   this.currentUid = uid;
   this.currentGroup = group;
   this.currentName = name;

   if ( this.style.content[uid] == undefined ){
      if(this.debug)console.log( uid + " not in style");
      return;
   }

   
   $("<div class='span7 offset1'><h2 class='styleMenu_menu_par_title'>" + this.mappingArray[uid].name + "</h2></div>").appendTo(this.widgetDivHeader);
   if ( this.mappingArray[uid].filter != "" && this.GetUids(name).length > 1){
      $("<p class='styleMenu_menu_filter_title'>(" + this.filterName(group,name,uid) + ")</p>").appendTo(this.widgetDivHeader);
   }

   if( this.groups[group][this.mappingArray[uid].name].type == "line" ){
      console.log("----------------");
      console.log("line");

      this.FillWidget(uid);

//      var casing = this.groups[group][this.mappingArray[uid].name].casing;
//      var center = this.groups[group][this.mappingArray[uid].name].center;
//      var casing_uid = this.GetUid(casing,this.mappingArray[uid].filter);
//      var center_uid = this.GetUid(center,this.mappingArray[uid].filter);
//
//      if ( casing_uid == null){
//         console.log("------");
//         console.log("no casing");
//      }
//      else{
//         console.log("------");
//         console.log("casing : " + casing_uid);
//         $('<h2 class="styleMenu_menu_par_title">casing </h2>').appendTo(this.widgetDiv);
//         this.FillWidget(casing_uid);
//      }
//
//      if ( center_uid == null){
//         console.log("no center");
//      }
//      else{
//         console.log("center : " + center_uid);
//         $('<h2 class="styleMenu_menu_par_title">center line </h2>').appendTo(this.widgetDiv);
//         this.FillWidget(center_uid);
//      }                      
   }
   else if( this.groups[group][this.mappingArray[uid].name].type == "poly" ){
      console.log("----------------");
      console.log("poly");

      this.FillWidget(uid);	  

      var border = this.groups[group][this.mappingArray[uid].name].line;
      var border_uid = this.GetUid(border,this.mappingArray[uid].filter);

//      if ( border_uid == null){
//         //if(this.debug)console.log("border not found : " + border);
//      }
//      else{
//         //if(this.debug)console.log("border found : " + border);
//         ///@todo
//      }      
   }
   else{
      console.log("----------------");
      console.log("Other");
      ///@todo
   }

   //this.updateSelectedZooms();
}


StyleMenu.prototype.openWidget = function(group,name,uid){
   var me = this;
   return function(){
      me.currentLayerId    = uid;
      me.refreshWidget(group,name,uid);
      me.resetEnabledZooms()
   } 
}


StyleMenu.prototype.GetGroupNameFilterFromLayerId = function(uid){
   for ( var group in this.groups ){ // for all groups of element
      if (!this.groups.hasOwnProperty(group)) {
         continue;
      }
      for ( var name in this.groups[group] ){    // for elements in group
         if (!this.groups[group].hasOwnProperty(name)) {
            continue;
         }
         var uids = this.GetUids(name);
         var childs = Array();
         if ( this.groups[group][name].type == "line" ){
            var casing = this.groups[group][name].casing;
            var center = this.groups[group][name].center;
            //if(this.debug)console.log(casing,center);
            childs = childs.concat( this.GetUids(casing) );
            childs = childs.concat( this.GetUids(center) );
         }
         else if (this.groups[group][name].type == "poly"){
            childs = childs.concat( this.GetUids(this.groups[group][name].line) );
         } 
         else{
            ///@todo
         }
         //if(this.debug)console.log(group,name,uids);
         if ( uids.length == 0 ){
            continue;
         }
         // primary object case
         for (var i = 0 ; i < uids.length ; i++){        // for uids of type "element" (different filters ... see landmark for exemple)
            var _uid = uids[i];
            if ( uid == _uid ){
               return {"group": group,"name": name, "filter": this.mappingArray[uid].filter, "uid": uid};
            }  
         }
         // child case
         for (var i = 0 ; i < childs.length ; i++){        // for uids of type "element" (different filters ... see landmark for exemple)
            var _uid = childs[i];
            if ( uid == _uid ){
               // lets find parent id
               for(var k = 0 ; k < uids.length ; ++k){
                  if ( this.mappingArray[uids[k]].filter == this.mappingArray[_uid].filter ){
                     return {"group": group,"name": name, "filter": this.mappingArray[uid].filter, "uid": uids[k]};
                  }
               }
            }  
         }
      }
   }
   return {"group": null, "name": null, "filter": null, "uid": null};
}


StyleMenu.prototype.__InsertAccordion = function(){

   $("#styleMenu_menu_accordion").remove();

   var outterAcc = $("<div class='styleMenu_menu_accordion' id='styleMenu_menu_accordion'></div>");
   outterAcc.appendTo(this.mainDiv);

   var groupNum = 0;

   for ( var group in this.groups ){ // for all groups of element
      if (!this.groups.hasOwnProperty(group)) {
         continue;
      }
      if(this.debug)console.log(group);

      $("<h1 id='styleMenu_menu_groupaccordion_head_group_" + groupNum + "'> Group : " + group + "</h1>").appendTo(outterAcc);
      var groupAcc = $("<div class='styleMenu_menu_accordion' id='styleMenu_menu_groupaccordion_div_group_" + groupNum +  "'></div>");
      groupAcc.appendTo(outterAcc);

      groupNum++;

      for ( var name in this.groups[group] ){    // for elements in group
         if (!this.groups[group].hasOwnProperty(name)) {
            continue;
         }
         if(this.debug)console.log("found ! : " + name );

         var uids = this.GetUids(name);

         if ( uids.length == 0 ){
            if(this.debug)console.log("Warning : no uid found for " + name, group);
            continue;
         }

         //if(this.debug)console.log("Found " + uids.length + " ids for " + name, group);

         for (var i = 0 ; i < uids.length ; i++){        // for uids of type "element" (different filters ... see landmark for exemple)
            var uid = uids[i];
            //if(this.debug)console.log(uid);
            // make header

            if ( this.mappingArray[uid].filter != "" && this.GetUids(name).length > 1){
               $('<h2 id="styleMenu_menu_headeraccordion_' + uid + '">' + this.filterName(group,name,uid)  + "</h2>").appendTo(groupAcc);
            }
            else{
               $('<h2 id="styleMenu_menu_headeraccordion_' + uid + '">' + this.mappingArray[uid].name + "</h2>").appendTo(groupAcc);
            }

            // bind onclick header event!
            var me = this
            $("#styleMenu_menu_headeraccordion_"+uid).bind('click', this.openWidget(group,name,uid));
            // fill inner div with some info
            var divIn = $("<div class='inner' id='divinner_" + groupNum + "_" + uid + "'></div>");
            divIn.appendTo(groupAcc);

            $("<strong>Properties :<strong>").appendTo(divIn);
            var ul = $("<ul></ul>");
            ul.appendTo(divIn);

            $("<li>" + "Filter : " + this.mappingArray[uid].filter + "</li>").appendTo(ul);
            $("<li>" + "Visible  : " + "<input type='checkbox' id='styleMenu_menu_check_" + uid + "' />" + "</li>").appendTo(ul);
            $("#styleMenu_menu_check_" + uid).click( this.GetCheckBoxCallBack(uid) );
            $("#styleMenu_menu_check_" + uid).attr('checked', this.style.content[uid]["visible"]);
            $("<li>" + "Place : " + this.style.content[uid]["layer"] + "</li>").appendTo(ul);

         } // end uid loop
      } // end name loop
   } // end group loop


   // fill an empty widget window ("zzz" does not exist !)
   this.__BuildWidget("xxx","yyy","zzz");

   //this.updateSelectedZooms();

   // configure accordion(s)
   $( ".styleMenu_menu_accordion" )
   .accordion({
      heightStyle: "content",
      collapsible: true,
      active: false
   })

   this.styleMenuParentEl.show();   //show me !
}

//--------------------------------------------------------------------------//

StyleMenu.prototype.BuildSimpleWidget = function(group, name, uid){
   
   var me = this;
   this.widgetDiv.empty();
   this.FillSimpleWidget(uid);

   try{
      var casing = this.groups[group][this.mappingArray[uid].name].casing;
      var center = this.groups[group][this.mappingArray[uid].name].center;
      var casing_uid = this.GetUid(casing,this.mappingArray[uid].filter);
      var center_uid = this.GetUid(center,this.mappingArray[uid].filter);
      
      if ( casing_uid ){
         this.FillSimpleWidget(casing_uid);
      }
      
      if ( center_uid ){
         this.FillSimpleWidget(center_uid);
      }    
   }
   catch(e){}

   var openMediumButton = $("<i class='icon-zoom-in icon-white touchable'></i>");
   openMediumButton.click(function() {
      me.size = StyleMenu.MEDIUM;
      me.refresh();
   });
   
   openMediumButton.appendTo(this.widgetDiv);
}

//--------------------------------------------------------------------------//

StyleMenu.prototype.FillSimpleWidget = function(uid){

   var rd = this.DefRuleIdFromZoom(uid,this.mapView.GetZoom());
   var def = rd.def;
   var ruleId = rd.ruleId;
   var rule = rd.rule;

   if(this.debug)console.log("Fill widget for",def,ruleId,rule);

   if ( ruleId < 0 ){
      if(this.debug)console.log("Cannot find ruleId for zoom " + this.mapView.GetZoom());
      return;
   }

   if ( rule < 0 ){
      if(this.debug)console.log("Cannot find rule for zoom " + this.mapView.GetZoom());
      return;
   }

   if ( def < 0 ){
      if(this.debug)console.log("Cannot find def for zoom " + this.mapView.GetZoom());
      return;
   }
   
   for( var p = 0 ; p < Object.size(Symbolizer.params[this.style.content[uid]["s"][rule]["s"][def]["rt"]] ) ; p++){  // this is read from a list of known params. 

      var paramName = Symbolizer.getParamName(this.style.content[uid]["s"][rule]["s"][def]["rt"],p);
      var paramValue = this.GetParamId(uid,ruleId,paramName);   

      if ( paramValue === undefined ){
         paramValue = Symbolizer.defaultValues[paramName];
         //continue;
      }
      //if(this.debug)console.log( paramName + " : " + paramValue ) ;

      if ( paramName == "fill" || paramName == "stroke" ){
         this.AddColorPicker(paramName,paramValue,uid,ruleId, this.widgetDiv);
      }
   }  
}

//--------------------------------------------------------------------------//

StyleMenu.prototype.refreshWidget = function(group,name,uid){

   switch (this.size) {
      
      case StyleMenu.SMALLEST:
         this.BuildSimpleWidget(group, name, uid);
         break;   
     
      case StyleMenu.MEDIUM:
         this.__BuildWidget(group, name, uid);
         break;
   }
   
   this.mapView.hud.placeElements();
}

//--------------------------------------------------------------------------//

StyleMenu.prototype.linkedUIDs = function (uid) {
   switch (uid) {
      case "000":
      case "001":
         return ["000", "001"]

      case "008":
      case "014":
         return ["008", "014"]
      
      default: 
         return [uid];
   }
}

//--------------------------------------------------------------------------//

StyleMenu.prototype.refresh = function () {

   var data = this.GetGroupNameFilterFromLayerId(this.currentLayerId);
   if ( data.group != null && data.name != null ){
      this.refreshWidget(data.group, data.name, data.uid);
      this.Accordion(data.group, data.name, data.uid);
      this.resetEnabledZooms()
  }
}

StyleMenu.prototype.ChangeSelectedSubLayer = function (layerIndex, subLayerId) {
   this.currentLayerIndex = layerIndex;
   this.currentLayerId    = subLayerId;
   this.refresh();
}

//--------------------------------------------------------------------------//
// DEPRECATED


//StyleMenu.prototype.DefFromRule = function(luid,rule){
// // CARE DEPRECATED this one is not usefull anymore and will/should return 0
// // because there is ONLY one def in each rule
//
// if ( this.style.content[luid] == undefined ){
//    if(this.debug)console.log( luid + " not in style");
//    return -1;
// }
//
// var def = 0;
// while ( Object.size(this.style.content[luid]["s"][rule]["s"][def]) < 3 ){
//    def = def + 1;
//    if ( def >= Object.size(this.style.content[luid]["s"][rule]["s"]) ){
//       if(this.debug)console.log("cannot find def ...", luid, rule);
//       return -1;
//    }
// }
// return def;
//}
//
StyleMenu.prototype.DefRuleIdFromZoom = function(luid,zoom){
 // CARE DEPRECATED this one will return the good ruleId and will/should return def 0

 if ( this.style.content[luid] == undefined ){
    if(this.debug)console.log( luid + " not in style");
    return {"def" : -1, "ruleId" : -1, "rule" : -1};
 }

 for(var rule = 0 ; rule < Object.size(this.style.content[luid]["s"]) ; rule++){ // rule
    var zmin = this.style.content[luid]["s"][rule]["zmin"];
    if ( zmin == zoom ){
       var def = 0;
       while ( Object.size(this.style.content[luid]["s"][rule]["s"][def]) < 3 ){
          def = def + 1;
          if ( def >= Object.size(this.style.content[luid]["s"][rule]["s"]) ){
             if(this.debug)console.log("cannot find def ...", luid, rule);
             def = -1;
             return {"def" : -1, "ruleId" : -1, "rule" : -1};
          }
       }
       return {"def" : def, "ruleId" : this.style.content[luid]["s"][rule]["s"][def]["id"], "rule" : rule};
    }
 }
 
 return {"def" : -1, "ruleId" : -1, "rule" : -1};
}
