import json
import random
import struct

random.seed()


data = { }
data ["data"] = []
data ["width"] = 256
data ["height"] = 1
data ["input_type"] = "RGBA"
data ["output_type"] = "RGBA"

data ["data"].append ( 0 )
data ["data"].append ( 0 )   
data ["data"].append ( 0 )
data ["data"].append ( 0 )
   
for i in range ( 1,256) :
   data ["data"].append ( i )
   data ["data"].append ( 255 - i )
   if ( i < 128):
      data ["data"].append ( 0 )
   else :
      data ["data"].append ( 255 )
   data ["data"].append ( 255 )
f = open ( "cb.json" ,"w" )
json.dump ( data , f)
f.close ( )

tilesize = 256
data = { }
data ["data"] = []
data ["width"] = tilesize
data ["height"] = tilesize
data ["input_type"] = "LUMINANCE"
data ["output_type"] = "LUMINANCE"

#for i in range ( 0,tilesize * tilesize) :
#   data ["data"].append ( random.randint(0,255) )

for i in range ( 0,tilesize * tilesize) :
   data ["data"].append ( 0 )

for i in range ( 32, tilesize - 32 ) :
   for j in range ( 32, tilesize - 32 ) :
      # #data ["data"][i * tilesize + j] = random.randint(1,255) 
      data ["data"][tilesize * j + i] = min( i+1 , 255 )
      # #data ["data"][tilesize * j + i] = i

#for i in range ( 0, tilesize  ) :
#   for j in range ( 0, tilesize  ) :
      # #data ["data"][i * tilesize + j] = random.randint(1,255) 
      #data ["data"][tilesize * j + i] = ( ( (i) * 2) % 255 ) +1
      #data ["data"][tilesize * j + i] = min( i+1 , 255 )
      #data ["data"][tilesize * j + i] = min( i+1 , 255 )
      # #data ["data"][tilesize * j + i] = i
#   print min( i+1 , 255 )
f = open ( "data.json" ,"w" )
json.dump ( data , f)
f.close ( )

f = open ("data.raw", "wb")
for i in data["data"]:
   f.write  ( struct.pack( "B"  , i ) )
f.close  ( )