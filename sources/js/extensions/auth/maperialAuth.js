//-------------------------------------------//
//Maperial Login Lib
//-------------------------------------------//

this.MaperialAuth = {};

//-------------------------------------------//

MaperialAuth.authorize = function() 
{
   if(App.Globals.isLocal){
      MaperialAuth.dummy();
      UserManager.getAccount();
      $("#loginWindow").trigger("reveal:close");
      return;
   }

   var authorizeURL = "http://auth.maperial.com/user/auth?redirect=http://www.maperial.com/maperialAuthToken";

   Utils.popup(authorizeURL, 'signin', 400, 150);
}

MaperialAuth.badtoken = function () 
{
   console.log("badtoken !!!");
}

MaperialAuth.tokenGranted = function (token, email) 
{
   App.user.set("email", email);
   App.user.set("maperialToken", token);
   App.user.set("loggedIn", true);

   UserManager.getAccount();
   $("#loginWindow").trigger("reveal:close");

   MaperialAuth.checkIfIsLoggedIn();
}

//-------------------------------------------//

MaperialAuth.checkIfIsLoggedIn = function()
{
   setTimeout(function(){
      $.ajax({
         type: "POST",  
         url: "http://auth.maperial.com/user/islogin",
         data: {token : App.user.maperialToken},
         success: function (data, textStatus, jqXHR)
         {
            if(data.login)
            {
               MaperialAuth.checkIfIsLoggedIn();
            }
            else{
               alert("logged out !");
               App.user.set("loggedIn", false);
            }
         }
      });

   }, 20*1000);
}

//-------------------------------------------//

MaperialAuth.dummy = function()
{
   App.user.set("name", "Bob Le Bobby");
   App.user.set("email", "dummy@maperial.fr");
   App.user.set("loggedIn", true);
}