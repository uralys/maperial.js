// ----------------------------//

function HomeScroller() {
   
}

// ----------------------------//

HomeScroller.prototype.resizeWindow = function() {
   var imgWidth = Math.max(1450, $(window).width());
   
   var leftOffset = 0;
   var offset = 1450 - $(window).width();
   if(offset > 0)
      leftOffset = offset/2;
   
   $(".imageBack").css("width", imgWidth + "px");
   $('.imageBack').css('-webkit-transform', 'translate3d(-'+ leftOffset +'px ,0, 0)');
   $('.imageBack').css('transform', 'translate3d(-'+ leftOffset +'px ,0, 0)');
}

// ----------------------------//

HomeScroller.prototype.scroll = function(event, delta) {

   var windowHeight = $(window).height();
   var scrollTop = $(window).scrollTop();
   var currentSlowScroll = scrollTop/3;

   $('#imageBackContainer1').css('-webkit-transform', 'translate3d(0, -'+ currentSlowScroll +'px ,0)');
   $('#imageBackContainer1').css('transform', 'translate3d(0, -'+ currentSlowScroll +'px ,0)');
   
   for(var i=2; i <= 4; i++){
      
      var visibility = "hidden";  
      var partHeight = $('#part'+i).height();
      var partStartTop = $('#part'+i).offset().top;
      var partStartBottom = partStartTop + partHeight;
      var partCurrentTop = partStartTop - scrollTop;
      var partCurrentBottom = partCurrentTop + partHeight;

      if(partCurrentBottom < windowHeight){
         visibility = "visible";

         if(partCurrentTop < 0)
            $('#imageBackContainer'+(i-1)).css('visibility', "hidden");
         else
            $('#imageBackContainer'+(i-1)).css('visibility', "visible");
         

         var scrollRequired = partStartBottom - windowHeight;
         var slowScrollRequired = scrollRequired/3;

         if(partCurrentTop < windowHeight){
            var dy = windowHeight - partHeight + slowScrollRequired + 1 - currentSlowScroll; // + 1 to smooth the link
         }

         $('#imageBackContainer'+i).css('transform', 'translate3d(0, '+ dy +'px ,0)');
         $('#imageBackContainer'+i).css('-webkit-transform', 'translate3d(0, '+ dy +'px ,0)');
      }
      
      $('#imageBackContainer'+i).css('visibility', visibility);
   }

   $('#header').css('transform', 'translate3d(0, 0 ,0)'); // sans quoi il ne reste pas fixe..?
   $('#header').css('-webkit-transform', 'translate3d(0, 0 ,0)'); // sans quoi il ne reste pas fixe..?
}
