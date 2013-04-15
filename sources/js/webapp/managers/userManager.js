//-------------------------------------------//
//UserManager
//-------------------------------------------//

this.UserManager = {};

//-------------------------------------------//

UserManager.getAccount = function()
{
   var params = new Object();
   params["user"] = App.user;

   $.ajax({
      type: "POST",  
      url: "/getAccount",
      data: JSON.stringify(params),  
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      success: function (account, textStatus, jqXHR)
      {
         App.user.set("uid", account.uid);
         App.user.set("email", account.email);
         App.user.set("name", account.name);
         App.user.set("maps", account.maps);
         App.user.set("styles", account.styles);
         App.user.set("datasets", account.datasets);
         App.user.set("colorbars", account.colorbars);
         App.user.set("fonts", account.fonts);
         App.user.set("icons", account.icons);
         
         DatasetManager.initDatasets();
         App.mapManager.getMaps(App.user);
      }
   });
   
   App.finishLoadings("dashboard");
}

//-------------------------------------------//