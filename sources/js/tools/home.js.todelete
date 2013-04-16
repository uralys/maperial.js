//----------------------------//

function Home (){
   this.position = 0;
   this.translator = new Translator(true);

   $(window).on(Translator.LANG_CHANGED, this.refreshHome);
}

//----------------------------//

Home.prototype.move = function() {
   try{
      document.getElementById('homeImage').style.backgroundPosition = (this.position--)+"px 0px" ;
   }
   catch(e){}
}

//----------------------------//

Home.prototype.tryNow = function() {
   if(navigator.appName == "Microsoft Internet Explorer")
      window.location.href = "http://maperial.com/pages/usechrome.html";
   else{
      $("#tryButton").addClass("hide");
      $("#signinButton").addClass("hide");
      $("#body").append('<img class="headerButton" src="http://static.maperial.localhost/images/mapediting/spin.white.gif" width="25px"/>');
      window.location.href = "http://maperial.herokuapp.com/#/tryscreen";
   }
}

Home.prototype.refreshHome = function () {
   $("#content").empty();
   var source   = $("#content-template").html();
   var template = Handlebars.compile(source);
   $("#content").append(template);

   $("area[rel^='prettyPhoto']").prettyPhoto();
   $(".gallery a[rel^='prettyPhoto']").prettyPhoto({animation_speed:'fast',slideshow:10000, hideflash: true});
}

//----------------------------//

var home;
$(document).ready(function(){
   home = new Home();

   setInterval( (function(home){
      return function(){
         home.move();
      }
   })(home) 
   , 30 );

});