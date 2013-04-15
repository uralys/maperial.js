// This will display a wait spin during each ajax request made (until success or error)
// just include this js, it will load the appropriate css and add an hidden div to 'body'

(function($) {
    var animations = {};
    $.ajaxPrefilter(function( options, _, jqXHR ) {
        var animation = options.animation && animations[ options.animation ];
        if ( animation ) {
            animation.start();
            jqXHR.then( animation.stop, animation.stop );
        }
    });
    $.ajaxAnimation = function( name, object ) {
        if ( object ) {
            animations[ name ] = object;
        }
        return animations[ name ];
    };
})( jQuery );

//function getCss(src) {
//   $('head').append('<link rel="stylesheet" type="text/css" href="' + src + '" />');
//}

$(function(){

  //getCss("css/ajaxwaitspin.css");
  //console.log("aws css added");

  $('<div id="aws_spinnerDiv" class="aws_spinner" style="display:none;">'     +
    '<img id="aws_img-spinner" src="http://static.maperial.localhost/images/spin.gif" alt="Loading"/>'         +
    '</div>' ).appendTo('body');
    
  console.log("aws div added");

  $("#aws_spinnerDiv").disableSelection();
  
  var ajaxReqCount = 0;
  
  jQuery.ajaxAnimation( "aws_spinner" , {
      start: function() {
         $("#aws_spinnerDiv").show();
         ajaxReqCount++;
         console.log(ajaxReqCount);
      },
      stop: function() {
         ajaxReqCount--;
         if ( ajaxReqCount < 1 ){
  	       $("#aws_spinnerDiv").hide();
         }
         console.log(ajaxReqCount);
      },
      error: function() {
         ajaxReqCount--;
         if ( ajaxReqCount < 1 ){
             $("#aws_spinnerDiv").hide();
         }
         console.log(ajaxReqCount);
      }
  } );
  
  jQuery.ajaxSetup({
      animation: "aws_spinner"
  });    
});
