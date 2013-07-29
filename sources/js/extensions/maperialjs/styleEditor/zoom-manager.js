
//========================================================================================================================================//
//ZOOMS
//========================================================================================================================//

StyleEditor.prototype.showZoomGroupEdition = function(){
   this.container = $("#"+this.mapView.name);
   $("#menuZoomGroupEdition").remove()

   if(parseInt(this.selectedZoomGroup.zmax) > parseInt(this.selectedZoomGroup.zmin))
      var zoomRangeText = "Zooms " +this.selectedZoomGroup.zmin+" to "+this.selectedZoomGroup.zmax;
   else
      var zoomRangeText = "Zoom " +this.selectedZoomGroup.zmin;
   
   var html = "<div id='menuZoomGroupEdition' class='reveal-modal'><h2>"+zoomRangeText+"</h2>";
   html +=  "<div class='row-fluid'>";
   html +=  "<div class='span4 offset4 btn-large btn-primary touchable' onclick='$(window).trigger(MaperialEvents.OPEN_ZOOMS)'>Split</div>";

   if(this.zoomGroups.length > 1){
      html +=  "<div class='span3 offset1 btn-danger btn-large touchable' onclick='$(window).trigger(MaperialEvents.DELETE_ZOOM_GROUP)'>Delete</div>";
   }

   html +=  "</div>";

   html +=  "<a class='close-reveal-modal'>&#215;</a></div>";

   this.container.append(html);

   this.menuZoomGroupEdition = $("#menuZoomGroupEdition").reveal({
      animation: 'fade',
      animationspeed: 300, 
   });
}

//-------------------------------------------------------------------------------------------------//

StyleEditor.prototype.openZooms = function(){
   
   //------------------------------------------------------//

   this.menuZoomGroupEdition.trigger("reveal:close")

   //------------------------------------------------------//

   var selectedMin   = parseInt(this.selectedZoomGroup.zmin)
   var selectedMax   = parseInt(this.selectedZoomGroup.zmax)

   //------------------------------------------------------//
   
   for(var z = 0 ; z < 19 ; z++){
      $("#zoomButton" + z ).uncheck();
      $("#zoomButton" + z ).disable();
      $("#zoomButton" + z ).button("refresh");
   }

   //------------------------------------------------------//

   for(var z = selectedMin ; z <= selectedMax ; z++){
      $("#zoomButton" + z ).check();
      $("#zoomButton" + z ).enable();
      $("#zoomButton" + z ).button("refresh");
   }

   //------------------------------------------------------//

   $( "#zoomSlider" ).slider({
      min: selectedMin,
      max: selectedMax
   })

   $( "#zoomSlider" ).slider( "values",  [selectedMin, selectedMax] );  

   //------------------------------------------------------//

   $( "#zoomSlider" ).css("width", ((selectedMax-selectedMin)*34.5)+"px");
   $( "#zoomSlider" ).css("margin-left", (15 + selectedMin*34.5)+"px");

   //------------------------------------------------------//

   this.zoomView = $("#"+HUD.ZOOMS).reveal({
      animation: 'fade',
      animationspeed: 100, 
   });
}

//-------------------------------------------------------------------------------------------------//

StyleEditor.prototype.resetEnabledZooms = function(){
   this.enableZooms  = []
   var rules         = this.style.content[this.currentLayerId]["s"]
   var nbRules       = rules.length

   for(var i = 0 ; i < nbRules; i++){
      var zmin = rules[i]["zmin"]
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
         
         console.log("open FULL view ", this.selectedZoomGroup);

         for(var z = parseInt(this.selectedZoomGroup.zmin) ; z < parseInt(this.selectedZoomGroup.zmax)+1 ; z++)
            this.selectedZooms[""+z] = true;

         break;
   }   
}

//----------------------------------------------------------------------------------------------------------------------//

StyleEditor.prototype.refreshSliderSelection = function(min, max){

   for(var z = 0 ; z < 19 ; z++){
      if ( z >= min && z <= max){
         $("#zoomButton" + z ).check();
      }
      else{
         $("#zoomButton" + z ).uncheck();
      }

      $("#zoomButton" + z ).button("refresh");
   }
}

//-------------------------------------------------------------------------------------//

StyleEditor.prototype.newZoomGroup = function(){

   //------------------------------------------------------//

   var group0 = []
   var group1 = []
   var group2 = []
   
   var groups = [group0, group1, group2]
   
   //------------------------------------------------------//

   var selectedMin   = parseInt(this.selectedZoomGroup.zmin)
   var selectedMax   = parseInt(this.selectedZoomGroup.zmax)

   //------------------------------------------------------//

   var checkGroup = function(z){
      if($("#zoomButton"+z).is(":checked"))
         return true;
      else
         return false;
   }
   
   var currentGroup = 0
   var currentGroupState = checkGroup(selectedMin)

   for ( var zoom = selectedMin ; zoom <= selectedMax ; zoom++){
      
      if ( checkGroup(zoom) != currentGroupState ){
         currentGroupState = !currentGroupState
         currentGroup ++
      }

      groups[currentGroup].push(zoom)
   } 

   //------------------------------------------------------//
   
   for(var g = 0; g < 3; g++){
      if(groups[g].length > 0){
         var splitId = Utils.generateGuid() // pour differencier les rules lors du gatherRules

         // - modify each rule in this.style.content to match each split
         for(var i = groups[g][0]; i <= groups[g][groups[g].length-1] ; i++){
            var ruleInStyle = this.getRule(this.currentLayerId, i)
            ruleInStyle.splitId = splitId
         }
      }
   }
   
   //-------------------------------------------------------//

   this.refreshWidget()
   
   //-------------------------------------------------------//

   this.zoomView.trigger("reveal:close")
}

//-------------------------------------------------------------------------------------//

StyleEditor.prototype.deleteZoomGroup = function(){

   //-------------------------------------------------------//

   var selectedMin   = parseInt(this.selectedZoomGroup.zmin)
   var selectedMax   = parseInt(this.selectedZoomGroup.zmax)

   var newMin, newMax
   
   //-------------------------------------------------------//
   
   // delete first zoomGroup : zoomGroup[1] 'eats' the range
   if(selectedMin == this.zoomGroups[0].zmin){
      newMin = selectedMin
      newMax = this.zoomGroups[1].zmax
   }

   // delete another zoomGroup : the previous zoomGroup 'eats' the range
   else{
      for(var i = 1; i < this.zoomGroups.length; i++){
         if(selectedMin == this.zoomGroups[i].zmin){
            newMin = this.zoomGroups[i-1].zmin
            newMax = selectedMax
            break
         }
      }
   }

   var splitId = Utils.generateGuid()
   var rule = this.getRule(this.currentLayerId, newMin)
   rule.splitId = splitId
   
   console.log("----------------------------- new ruleSet : ")
   for(var z = newMin; z <= newMax ; z++){
      this.copyRule(this.currentLayerId, z, rule)
      odump(this.getRule(this.currentLayerId, i))
   }
   
   //-------------------------------------------------------//

   this.refreshWidget()
   
   //-------------------------------------------------------//

   this.menuZoomGroupEdition.trigger("reveal:close")
}

//----------------------------------------------------------------------------------------------------------------------//

StyleEditor.prototype.buildZoomView = function(){
   
   this.zoomDiv.append("<a class='close-reveal-modal'>&#215;</a></div>");
   
   var me = this;
   var buttons = '';
   for ( var z = 0 ; z < 19 ; z++){
      buttons += '  <input type="checkbox" id="zoomButton' + z + '"/><label id="zoomButton' + z + '_label" class="zoom-button" for="zoomButton' + z + '">' + z + '</label>';
   }    

   $('<div id="zoomButtons">' +  buttons + '</div>' ).appendTo(this.zoomDiv);
   $('<div id="zoomSlider"></div><br/>').appendTo(this.zoomDiv);
   $("<div class='row-fluid'><div class='span2 offset10 btn-large btn-primary touchable' onclick='$(window).trigger(MaperialEvents.VALIDATE_ZOOMS)'>Ok</div></div><br/>").appendTo(this.zoomDiv);

   for ( var z = 0 ; z < 19 ; z++){
      $("#zoomButton"+z).change(function(zoom){
         return function(){
            console.log("changed " + zoom)
            var attr = $(this).attr('checked');
            var isCheck = (typeof attr !== 'undefined' && attr !== false)
            console.log("isCheck " + isCheck)
            
            if ( isCheck ){
               $("#zoomButton" + zoom ).uncheck();
            }
            else{
               $("#zoomButton" + zoom ).check();
            }

            $("#zoomButton" + zoom ).button("refresh");
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
         var min = ui.values[0];
         var max = ui.values[1];

         me.refreshSliderSelection(min, max)
      }
   });

   Utils.buildSliderStyle("zoomSlider");
}

//------------------------------------------------------------------//

StyleEditor.prototype.gatherRulesByZoom = function(uid){

   var rules         = this.style.content[uid]["s"]
   var start         = rules[0].zmin
   var end           = rules[0].zmin
   var currentRule   = rules[0]["s"][0]

   var loopEndsWithNewRule
   this.zoomGroups    = []

   for (var i = 1; i < rules.length; i++){
      loopEndsWithNewRule = false
      var nextRule = rules[i]["s"][0]

      if(this.isSameRule(currentRule, nextRule)){
         end = rules[i].zmin
      }
      else{
         this.createZoomGroup(start, end, currentRule, uid)
         currentRule = nextRule
         start       = rules[i].zmin
         end         = rules[i].zmin
         
         if(i < rules.length - 1) // else last rule = require a createZoomGroup for it
            loopEndsWithNewRule = true
      }
   }

   if(!loopEndsWithNewRule){
      this.createZoomGroup(start, end, currentRule, uid)
   }
}

StyleEditor.prototype.createZoomGroup = function(start, end, rule, uid){
   
   console.log("createZoomGroup", start,end,rule,uid)
   
   var zoomGroup = {}
   zoomGroup.zmin = start
   zoomGroup.zmax = end
   zoomGroup.rule = rule

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


