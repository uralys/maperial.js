function RenderLine ( ctx , line )  {
   ctx.beginPath();
   ctx.moveTo(line[0],line[1]);
   for (var p = 2 ; p < line.length - 1 ; p = p + 2) {
      ctx.lineTo(line[p],line[p+1]);      
   }
   if (line[line.length-1] == 'c')
      ctx.closePath();
}
   
function RenderLineDA ( ctx , line , da)  {
   if ( da.length % 2 != 0 ) //  example  : [ 6,3,2 ] => [ 6,3,2,6,3,2 ] see css reference !
      da = da.concat(da)

   var line = line.slice(0);
      
   var closeIt = false;
   if ( line[line.length-1] == 'c') {
      line.pop();
      line.push(line[0])
      line.push(line[1])
      closeIt = true;
   }
   else
      line.pop();

   if ( line.length < 4 ) {
      RenderLine ( ctx, line )
      return 
   }
   
   ctx.beginPath();
   ctx.moveTo(line[0],line[1]);

   var i = 0;
   var m = da.length;
   var c = 0; // carry
   var a = 0; // acc
   for (var p = 0 ; p < line.length - 4 ; p = p + 2) {
      var p0x = line [p +0  ];
      var p0y = line [p + 1 ];
      var p1x = line [p + 2 ];
      var p1y = line [p + 3 ];
      var vx = p1x - p0x;
      var vy = p1y - p0y;
      var n = Math.sqrt ( vx*vx + vy*vy );

      while ( true )  {
         if (c == 0) {
            a = a + da[i] ;
         }
         else {
            a = a + c;
            c = 0;
         }
         if (a >= n) {
            if ( i % 2 == 0 ) ctx.lineTo(px,py);
            else              ctx.moveTo(px,py);
            c = a - n
            a = 0
            if (c == 0) {
               i = (i + 1) % m
            }
            break;
         }
         var r = a / n;
         var px = p0x + vx * r
         var py = p0y + vy * r
         if ( i % 2 == 0 ) ctx.lineTo(px,py);
         else              ctx.moveTo(px,py);
         i = (i + 1) % m
      }
   }
   if (closeIt)
      ctx.closePath()
}