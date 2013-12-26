# Build Requirement :

    - nodejs
    - make
    - browserify
    - uglifyjs

    npm install .
    npm install -g browserify uglify-js

# Make target

### developement build 		(js uncompressed)
    $ make dev 

### production build 		(uglyfied)
    $ make min

### rebuild javascript only (uncompressed)
    $ make jsdev

### rebuild javascript only (uglyfied)
    $ make jsmin