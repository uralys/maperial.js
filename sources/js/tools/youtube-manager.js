
/** @constructor */
function YoutubeManager(){
   this.player = null;
   this.cancelNextPlay = false;
}

YoutubeManager.prototype.openVideoWindow = function(lang) 
{
   var me = this;
   this.lang = lang;

   $('#videoWindow').off('reveal:hidden');
   $('#videoWindow').off("reveal:revealed");
   
   $("#videoWindow").reveal({
      animation: 'fade',
      animationspeed: 100, 
   });

   $('#videoWindow').on('reveal:hidden', function(){
      me.stop();
      $("#maperialVideo").remove()
   });

   var me = this;
   
   $("#maperialVideo").remove()
   $('#videoWindow').append("<div id='maperialVideo'></div>")

   this.load();
   
   // center.....dont ask me about the + 285 stuff
   var left = ($(window).width()/2 - $("#videoWindow").width()/2) + 285
   
   $("#videoWindow").css("left",left+"px");
}

YoutubeManager.prototype.stop = function() {
   this.cancelNextPlay = true;
   this.player.stopVideo();
   this.player.clearVideo();
}

YoutubeManager.prototype.play = function() {
   
   if(this.cancelNextPlay){
      this.cancelNextPlay = false;
      return;
   }

   this.player.clearVideo();
   this.player.setPlaybackQuality("hd1080")
   this.player.playVideo();
}

YoutubeManager.prototype.load = function() {

   this.player = new YT.Player('maperialVideo', {
      width: '843',
      height: '480',
      events: {
         'onStateChange': function (event) {
            switch (event.data) {
               case -1:
                console.log ('unstarted');
                  me.play();
                  break;
               case 0:
                console.log ('ended');
                  me.stop();
                  break;
               case 1:
                console.log ('playing');
                  break;
               case 2:
                console.log ('paused');
                  break;
               case 3:
                console.log ('buffering');
                  break;
               case 5:
                console.log ('video cued');
                  break;
            }
         }
      },
      videoId: this.lang == "en" ? "Ba7Iwek--SU" : "Z2XgfBkJjj4"
   });
}

//-----------------------------------------------------------------------------//

window.youtubeManager = window.youtubeManager || new YoutubeManager();

//-----------------------------------------------------------------------------//