
function GLTools () {

   GLTools.prototype.RenderLayer = function  ( ctx ,  layer ) {
      id = layer["i"]
      cl = layer["c"]
      ll = layer["g"]
      if (ll == null) return 
      for ( l = 0 ; l < ll.length ; ++l ) {
         lines = ll[l]
         for ( li = 0 ; li < lines.length ; ++li ) {
            line = lines[li]
            ctx.beginPath();
            ctx.moveTo(line[0],line[1]);
            for (p = 2 ; p < line.length - 1 ; p = p + 2) {
               ctx.lineTo(line[p],line[p+1]);      
            }
            if ( line[line.length-1] == "c")
               ctx.closePath()
            this[cl](ctx); 
         }
      }
   }

   GLTools.prototype.LoadCanvasAsTexture = function  ( gl , inUrl , inCallback ) {
      var tex     = gl.createTexture();
      tex.isLoad  = false; 
      tex.error   = false;
      tex.req     = $.ajax({
         type     : "GET",
         url      : inUrl,
         dataType : "json",  
         success  : function(data, textStatus, jqXHR) {
            tex.svgRenderer = document.createElement("canvas");
            tex.svgRenderer.height = 256;
            tex.svgRenderer.width  = 256;
            
            for ( i = 0 ; i < data["l"].length ; ++i ) {
               RenderLayer  (  tex.svgRenderer.getContext("2d") , data["l"][i] )
            }
            
            //canvg(tex.svgRenderer, data);
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tex.svgRenderer);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.bindTexture(gl.TEXTURE_2D, null);
            tex.isLoad    = true;
            tex.Error     = false;
            inCallback() ;
         },
         error : function(jqXHR, textStatus, errorThrown) {
            tex.isLoad = true;
            tex.error  = true;
            console.log ( inUrl + " : loading failed : " + textStatus );
            inCallback ({},{});
         }
      });    
      return tex
   }

   GLTools.prototype.LoadSvgAsTexture = function  ( gl , inUrl , inCallback ) {
      /*var tex     = gl.createTexture();
      tex.isLoad  = false; 
      tex.error   = false;
      tex.req     = $.ajax({
         type     : "GET",
         url      : inUrl,
         dataType : "text",  
         success  : function(data, textStatus, jqXHR) {
            tex.svgRenderer = document.createElement("canvas");
            canvg(tex.svgRenderer, data
               //,{
               //   ignoreMouse       : true,
               //   ignoreAnimation   : true,
               //   ignoreDimensions  : true,
               //   renderCallback    : function() {
               //      gl.bindTexture(gl.TEXTURE_2D, tex);
               //      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
               //      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tex.svgRenderer);
               //      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
               //      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
               //      gl.bindTexture(gl.TEXTURE_2D, null);
               //      tex.isLoad    = true;
               //      tex.Error     = false;
               //      inCallback() ;
               //   }
               ///
            );
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tex.svgRenderer);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.bindTexture(gl.TEXTURE_2D, null);
            tex.isLoad    = true;
            tex.Error     = false;
            inCallback() ;
         },
         error : function(jqXHR, textStatus, errorThrown) {
            shader.isLoad = true;
            shader.error  = true;
            console.log ( inUrl + " : loading failed : " + textStatus );
            inCallback ({},{});
         }
      });    */
      var tex     = gl.createTexture();
      tex.isLoad  = false; 
      tex.error   = false;
      var img     = new Image;
      tex.req     = $.ajax({
         type     : "GET",
         url      : inUrl,
         dataType : "text",  
         success  : function(data, textStatus, jqXHR) {
            img.onload = function(){
               tex.svgRenderer = document.createElement("canvas");
               var ctx = tex.svgRenderer.getContext('2d');
               ctx.drawImage(img,0,0);
               
               gl.bindTexture(gl.TEXTURE_2D, tex);
               gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
               gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tex.svgRenderer);
               gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
               gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
               gl.bindTexture(gl.TEXTURE_2D, null);
               tex.isLoad    = true;
               tex.Error     = false;
               inCallback() ;  
            };
            img.src    = "data:image/svg+xml;base64,"+btoa(data);
         },
         error : function(jqXHR, textStatus, errorThrown) {
            shader.isLoad = true;
            shader.error  = true;
            console.log ( inUrl + " : loading failed : " + textStatus );
            inCallback ({},{});
         }
      });
      return tex
   }
   
   GLTools.prototype.CreateFrameBufferTex = function  ( gl , sizeX, sizeY ) {
      var fb                        = gl.createFramebuffer();
      var tex                       = gl.createTexture(); 

      gl.bindFramebuffer            ( gl.FRAMEBUFFER, fb);
      fb.width                      = sizeX;
      fb.height                     = sizeY;
      
      gl.bindTexture                ( gl.TEXTURE_2D, tex );
      gl.texParameteri              ( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
      gl.texParameteri              ( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST );
      gl.texImage2D                 ( gl.TEXTURE_2D, 0, gl.RGBA, fb.width, fb.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null );
      gl.framebufferTexture2D       ( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0 );
      gl.bindTexture                ( gl.TEXTURE_2D, null );
      gl.bindFramebuffer            ( gl.FRAMEBUFFER, null );

      return [fb,tex];
   }
   
   GLTools.prototype.BuildShader = function  ( gl , inShader ) {
      var shader        = new Object ( );
      shader.error      = false;
      shader.obj        = null;
      shader.attributes = inShader.attributes;
      shader.parameters = inShader.parameters;
      
      if (inShader.type == "x-shader/x-fragment") {
         shader.obj = gl.createShader(gl.FRAGMENT_SHADER);
      } else if (inShader.type == "x-shader/x-vertex") {
         shader.obj = gl.createShader(gl.VERTEX_SHADER);
      } else {
         shader.error  = true;
         return;
      }

      gl.shaderSource   ( shader.obj, inShader.code );
      gl.compileShader  ( shader.obj );
      if (!gl.getShaderParameter(shader.obj, gl.COMPILE_STATUS)) {
         shader.error  = true;
         console.log ( "Build " + inShader.name + " : Failed ! " );
         console.log (gl.getShaderInfoLog(shader.obj));            
      }
      return shader;
   }
   
   GLTools.prototype.MakeProgram = function ( inVertexName , inFragmentName , inAssets ) {
      if (! inAssets.shaderData ) {
         console.log ( "invalid shader data" );
         return null;
      }
      if ( ! ( inVertexName in inAssets.shaderData ) ) {
         console.log ( inVertexName + " not in shader data" );
         return null;
      }
      if ( ! ( inFragmentName in inAssets.shaderData ) ) {
         console.log ( inFragmentName + " not in shader data" );
         return null;
      }
      var vert             = inAssets.shaderData[inVertexName];
      vert.name            = inVertexName
      var frag             = inAssets.shaderData[inFragmentName];
      frag.name            = inFragmentName
               
      var gl               = inAssets.ctx;
      var vertObj          = this.BuildShader(gl,vert);
      var fragObj          = this.BuildShader(gl,frag);
      
      if ( vertObj.error || fragObj.error ) {
         return null;
      }
      var shaderProgram    = gl.createProgram();
      shaderProgram.error  = false;
      shaderProgram.attr   = {};
      shaderProgram.params = {};
      var attributes       = {};
      var parameters       = {};
      
      jQuery.extend( attributes, vertObj.attributes );
      jQuery.extend( parameters, vertObj.parameters );
      jQuery.extend( attributes, fragObj.attributes );
      jQuery.extend( parameters, fragObj.parameters );
      
      gl.attachShader( shaderProgram , vertObj.obj );
      gl.attachShader( shaderProgram , fragObj.obj);
      gl.linkProgram ( shaderProgram );
      if (! gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
         console.log ( "Could not link programm with " +inVertexName + " and " + inFragmentName);
         shaderProgram.error  = true;
         return ;
      }
      gl.useProgram(shaderProgram);
      for (var key in attributes) {
         shaderProgram.attr[key]    = gl.getAttribLocation( shaderProgram, attributes[key] ); 
      }
      for (var key in parameters) {
         shaderProgram.params[key] = {}
         shaderProgram.params[key]["name"] = gl.getUniformLocation(shaderProgram, parameters[key][0]);
         shaderProgram.params[key]["fct"]  = parameters[key][1];
      }
      return shaderProgram;
   }
   
   GLTools.prototype.LoadTexture = function  (gl , url , callback) {
      /*
      var tex     = gl.createTexture();
      tex.isLoad  = false; 
      tex.image   = new Image();
      tex.image.onload = function () {
         gl.bindTexture(gl.TEXTURE_2D, tex);
         gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
         gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tex.image);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
         gl.bindTexture(gl.TEXTURE_2D, null);
         tex.isLoad = true;
         delete tex.image;
         callback() ; 
      }
      
      tex.image.src = url;
      return tex;
      */
      var tex     = gl.createTexture();
      tex.isLoad  = false; 
      tex.error   = false;
      var   img   = new Image();
      img.onload  = function () {
         gl.bindTexture(gl.TEXTURE_2D, tex);
         gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
         gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
         gl.bindTexture(gl.TEXTURE_2D, null);
         tex.isLoad = true;
         delete img;
         callback() ; 
      };
      img.onerror =  function () {
         tex.isLoad = true;
         tex.error  = true;
         delete img;
      };
      img.onabort = function () {
         tex.isLoad = true;
         tex.error  = true;
         delete img;
      };
      
      img.src = url;
      return tex;
   }


   GLTools.prototype.LoadCsvTexture = function (gl , url , callback) {
   /*
      var tex     = gl.createTexture();
      tex.isLoad  = false; 
      tex.image   = new Image();
      tex.image.onload = function () {
         gl.bindTexture(gl.TEXTURE_2D, tex);
         gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
         gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tex.image);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
         gl.bindTexture(gl.TEXTURE_2D, null);
         tex.isLoad = true;
         delete tex.image;
         callback() ; 
      }
      
      tex.image.src = url;
      return tex;
      */
      
      var svgRenderer = document.createElement("canvas");
      canvg(this.svgRenderer, 'test/auv.svg');
      var tex     = gl.createTexture();
      tex.isLoad  = false; 
      tex.error   = false;
      var   img   = new Image();
      img.onload  = function () {
         gl.bindTexture(gl.TEXTURE_2D, tex);
         gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
         gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
         gl.bindTexture(gl.TEXTURE_2D, null);
         tex.isLoad = true;
         delete img;
         callback() ; 
      };
      img.onerror =  function () {
         tex.isLoad = true;
         tex.error  = true;
         delete img;
      };
      img.onabort = function () {
         tex.isLoad = true;
         tex.error  = true;
         delete img;
      };
      
      img.src = url;
      return tex;
   }


   GLTools.prototype.LoadData = function (gl, inUrl ) {
      var tex     = gl.createTexture();
      tex.isLoad  = false;
      tex.error   = false;
      
      tex.req = $.ajax({
         type     : "GET",
         url      : inUrl,
         dataType : "json",  
         success  : function(data, textStatus, jqXHR) {
            tex.isLoad = true;
            tex.error  = false;
            
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl[data.input_type], data.width , data.height, 0, gl[data.output_type], gl.UNSIGNED_BYTE, new Uint8Array(data.data));
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
         },
         error : function(jqXHR, textStatus, errorThrown) {
            tex.isLoad = true;
            tex.error  = true;
            console.log ( inUrl + " : loading failed : " + textStatus );
         }
      });
      
      tex.src = inUrl;
      return tex;   
   }
   
}