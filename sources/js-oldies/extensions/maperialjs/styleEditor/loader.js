
//=================================================================================================================//
// LOADER
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

//-------------------------------------------------------------------------------------------------//

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
   
   this.buildStyleEditor();  
}

