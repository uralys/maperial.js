//-------------------------------------------//
//ColorbarManager
//-------------------------------------------//

this.ColorbarManager = {};

//-------------------------------------------//

ColorbarManager.uploadNewColorbar = function(colorbar)
{
   $.ajax({
      type: "POST",
      url: App.Globals.mapServer + "/api/colorbar?_method=DATA",
      data: JSON.stringify(colorbar.content),  
      dataType: "json",
      success: function (data, textStatus, jqXHR)
      {
         var result = data.files[0];
         var colorbarUID = result.uid;

         var newColorbar = App.colorbarsData.selectedColorbar;
         newColorbar.uid = colorbarUID;
         newColorbar.content = null; // useless to keep user.colorbar[i].content (full colorbar.json) all around (+ doesnt work with a huge json..?)

         App.user.colorbars.pushObject(newColorbar);
         App.get('router').transitionTo('colorbars');

         ColorbarManager.addColorbarInDB(newColorbar);
      }
   });
}


ColorbarManager.saveColorbar = function(colorbar)
{
   App.user.set("waiting", true);

   $.ajax({
      type: "POST",
      url: App.Globals.mapServer + "/api/colorbar?_method=DATA&uid=" + colorbar.uid,
      data: JSON.stringify(colorbar.content), 
      dataType: "text",
      success: function (data, textStatus, jqXHR)
      {
         colorbar.content = null; // useless to keep user.colorbar.content (full colorbar.json) all around (+ doesnt work with a huge json..?)
         ColorbarManager.editColorbarInDB(colorbar);
      }
   });
}

//-------------------------------------------//

ColorbarManager.addColorbarInDB = function(colorbar)
{
   var params = new Object();
   params["user"] = App.user;
   params["colorbar"] = colorbar;

   $.ajax({  
      type: "POST",  
      url: "/addColorbar",
      data: JSON.stringify(params),  
      contentType: "application/json; charset=utf-8",
      dataType: "text",
      success: function (data, textStatus, jqXHR)
      {

      }
   });
}

//-------------------------------------------//

ColorbarManager.editColorbarInDB = function(colorbar)
{
   var params = new Object();
   params["colorbar"] = colorbar;

   $.ajax({  
      type: "POST",  
      url: "/editColorbar",
      data: JSON.stringify(params),  
      contentType: "application/json; charset=utf-8",
      dataType: "text",
      success: function (data, textStatus, jqXHR)
      {
         App.user.set("waiting", false);
      }
   });
}

//-------------------------------------------//

ColorbarManager.getColorbar = function(colorbarUID, next)
{
   console.log("getColorbar : " + colorbarUID);

   $.ajax({  
      type: "GET",  
      url: App.Globals.mapServer + "/api/colorbar/" + colorbarUID,
      dataType: "json",
      success: function (data, textStatus, jqXHR)
      {
         console.log("data : " + data);
         App.colorbarsData.set("selectedColorbar.content", data);
         next();
      }
   });
}

//-------------------------------------------//

ColorbarManager.deleteColorbar = function(colorbar)
{
   $.ajax({  
      type: "DELETE",  
      url: App.Globals.mapServer + "/api/colorbar?key=" + colorbar.uid,
      dataType: "text",
      success: function (data, textStatus, jqXHR)
      {
         // remove from the user list
         App.user.colorbars.removeObject(colorbar);

         // remove from the db
         var params = new Object();
         params["colorbar"] = colorbar;

         $.ajax({  
            type: "POST",  
            url: "/removeColorbar",
            data: JSON.stringify(params),  
            contentType: "application/json; charset=utf-8"
         });
      }
   });
}

//-------------------------------------------//