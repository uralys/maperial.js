

//========================================================================================================================//
//SIMPLE - all zooms
//========================================================================================================================//


StyleEditor.prototype.BuildSimpleWidget = function(){

   //--------------------------------------------------------------//

   var uid = this.selectedGroup ? this.selectedGroup.elements[0].uid : this.currentLayerId;

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

   for(var group = 0; group < propertyGroups.length; group++){
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
