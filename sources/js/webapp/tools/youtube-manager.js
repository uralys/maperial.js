
/** @constructor */
function YoutubeManager(){
   this.player = null;
   this.cancelNextPlay = false;
}

YoutubeManager.prototype.openVideoWindow = function() 
{
   var me = this;
   $("#videoWindow").modal();
   $('#videoWindow').off("hide");
   $('#videoWindow').off("show");
   
   $('#videoWindow').on("hide", function(){
      me.stop();
   });

   this.load();

//   $("#videoWindow").css("left", $(window).width() - $("#videoWindow").width() );
   $("#videoWindow").css("left", "40%" );
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
   this.player.playVideo();
}

YoutubeManager.prototype.load = function() {
   
   if(this.player){
      this.play();
      return;
   }
   
   var me = this;

   this.player = new YT.Player('maperialVideo', {
      width: '843',
      height: '480',
      videoId: 'c9_pf_YZZg4',
      events: {
         'onStateChange': function (event) {
            switch (event.data) {
            case -1:
//               console.log ('unstarted');
               me.play();
               break;
            case 0:
//               console.log ('ended');
               me.stop();
               break;
            case 1:
//               console.log ('playing');
               break;
            case 2:
//               console.log ('paused');
               break;
            case 3:
//               console.log ('buffering');
               break;
            case 5:
//               console.log ('video cued');
               break;
            }
         }
      }
   });
}

//-----------------------------------------------------------------------------//

window.youtubeManager = window.youtubeManager || new YoutubeManager();

//-----------------------------------------------------------------------------//