

module.exports = function(grunt) {

    var gruntCfg = {
            pkg : grunt.file.readJSON('package.json'),

            browserify: {

                /* the real browserify build */
                standalone: {
                    src: [ 'sources/js/maperialjs/core/maperial.js' ],
                    dest: 'static/js/maperial.dev.js',
                    options: {
                        debug: true,
                        standalone: '<%= pkg.name %>'
                    }
                },

                /* just for quick compile testing */
                compile: {
                    src: [ 'sources/js/maperialjs/core/maperial.js' ],
                    dest: 'static/js/maperial.dev.js'
                },
            },

            uglify : {
                options : {
                    banner : '/**! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
                    mangle : true
                },
                build : {
                    files : {
                        'static/js/maperial.min.js' : ['static/js/maperial.dev.js']
                    }
                }
            },


            sass: {
                options: {
                   compass   : true,
                   sourcemap : true,
                   quiet     : true,
                   style     : 'compressed'
                },
                dist: {
                    files: [{
                        expand: true,
                        cwd: 'sources/css/sass/',
                        src: ['maperial.scss'],
                        dest: 'static/css/',
                        ext: '.css'
                    }],
                }
            },

            exec : {
                clean    : "rm -rf static/",
                tmp      : "mkdir -p static; mkdir -p static/js; mkdir -p static/css; mkdir -p static/shaders",
                assets   : "cp -r assets/symbols static/symbols; cp sources/shaders/all.json static/shaders/all.json",
                stage    : "mv static/js/maperial.dev.js static/js/maperial.js",
                prod     : "rm static/js/maperial.dev.js; mv static/js/maperial.min.js static/js/maperial.js"
            },

    };

    /** Init Project configuration. */
    grunt.initConfig(gruntCfg);

    /** load plugin tasks */
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-renderer');
    grunt.loadNpmTasks('grunt-exec');
    grunt.loadNpmTasks('grunt-contrib-sass');

    /** define custom tasks */
    grunt.registerTask('css',       ['sass:dist']);
    grunt.registerTask('compile',   ['browserify:compile']);
    grunt.registerTask('standalone',['browserify:standalone']);
    grunt.registerTask('clean',     ['exec:clean']);
    grunt.registerTask('jsdev',     ['standalone','exec:stage']);
    grunt.registerTask('jsmin',     ['standalone', 'uglify','exec:prod']);

    /** register custom 'deps' task */
    grunt.registerTask('dev',       ['exec:clean','exec:tmp','jsdev', 'css', 'exec:assets']);
    grunt.registerTask('min',       ['exec:clean','exec:tmp','jsmin', 'css', 'exec:assets']);

    /** default is min */
    grunt.registerTask('default',['min']);
};
