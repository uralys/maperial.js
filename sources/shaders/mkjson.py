import shutil
import os
import sys
import glob
import json


path = "."

#glList = glob.glob ( path + "/*.gl")

#glList =  glob.glob(os.path.join('path','*.gl'))
glList = []
glList += glob.glob(os.path.join(path,'*','*.gl'))
glList += glob.glob(os.path.join(path,'*','*','*.gl'))
glList += glob.glob(os.path.join(path,'*','*','*','*.gl'))

fuse = {}

for g in glList :
   tmp = os.path.basename ( g ).split(".")
   basename = tmp[:len(tmp)-1]
   basename = str().join(basename)
   jsonf    = os.path.dirname( g )+'/'+ basename + ".json"
   jsonfOut = basename + ".json"
   
   if not os.path.exists ( path + "/" +  jsonf ) :
      continue
   
   print "Make " + g
   c = str()
   f = open ( g , "r" )
   for l in f:
      l = l.strip()
      if len(l) > 0 :
         c = c + l + "---";
   
   f.close()
   
   f = open ( jsonf , "r")
   j = json.load (f)
   j["code"] = c
     
   f = open ( jsonfOut , "w")
   json.dump ( j,f,indent=1)
   f.close()
   
   fuse[basename] = j
   print g + " ok"
   

f = open ( "all.json" , "w")
json.dump ( fuse,f,indent=None)
f.close()
   
        