
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

   this.refreshMap();
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

                  this.refreshMap();
                  return true;
               }
            }
            //if(this.debug)console.log(" not found , adding!" , uid , ruid , param);
            this.style.content[uid]["s"][rule]["s"][d][param] = value;

            this.refreshMap();
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
      for ( var e = 0; e < this.selectedGroup.elements.length; e++ ){   
         var element = this.selectedGroup.elements[e]
         uidsToEdit.push(element.uid)
      }
   }
   else{
      uidsToEdit.push(uid)
   }

   for(var i = 0; i < uidsToEdit.length; i++){
      var uid = uidsToEdit[i]

      if ( this.style.content[uid] == undefined ){
         console.log( uid + " not in style");
         return false;
      }

      var rules   = this.style.content[uid]["s"]
      var nbRules = rules.length

      for(var r = 0 ; r < nbRules; r++){
         var z = rules[r]["zmin"];

         if ( this.selectedGroup || this.selectedZooms[z] ){
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

//====================================================================================================//


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

StyleEditor.prototype.isSameRule = function(rule1, rule2){

   for(var property1 in rule1){

      if(property1 == "id") continue 
      var found = false

      for(var property2 in rule2){
         if(property2 == "id") continue

         if(property1 == property2){
            found = true

            if(rule1[property1] != rule2[property2]){
               return false
            }

            break
         }
      }

      if(!found){
         return false
      }
   }

   return true
}

//------------------------------------------------------------------//

StyleEditor.prototype.copyRule = function(uid, zoom, rule){

   var rules = this.style.content[uid]["s"]
   var ruleToEdit
   
   for (var i = 0; i < rules.length; i++){
      if(rules[i].zmin == zoom){
         ruleToEdit = rules[i]["s"][0]
      }
   }

   for(var property in rule){
      if(property == "id") continue 
      ruleToEdit[property] = rule[property]
   }
}

//------------------------------------------------------------------//

StyleEditor.prototype.getZoomGroupLabel = function(zoomGroup){
   if(zoomGroup.zmin != zoomGroup.zmax)
      return zoomGroup.zmin +" - "+zoomGroup.zmax   
      else
         return zoomGroup.zmin
};


//====================================================================================================//

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