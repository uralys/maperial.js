// ----------------------------//

function HomeMover (){
   this.position = 0;
}
   
// ----------------------------//

HomeMover.prototype.move = function() {
   try{
      document.getElementById('homeImage').style.backgroundPosition = (this.position--)+"px 0px" ;
   }
   catch(e){}
}

// ----------------------------//

//HomeMover.prototype.tryNow = function() {
//   if(navigator.appName == "Microsoft Internet Explorer")
//      window.location.href = "http://www.maperial.com/#/usechrome";
//   else{
//      $("#tryButton").addClass("hide");
//      $("#signinButton").addClass("hide");
//      $("#body").append('<img class="headerButton" src="http://static.maperial.localhost/images/mapediting/spin.white.gif" width="25px"/>');
//      window.location.href = "http://www.maperial.com/#/tryscreen";
//   }
//}

// ----------------------------//

//var homeMover = new HomeMover();
//setInterval( (function(homeMover){
//   return function(){
//      homeMover.move();
//   }
//})(homeMover) 
//, 30 );