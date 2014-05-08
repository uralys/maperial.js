

module.exports = function(grunt) {

    var gruntCfg = {
            pkg : grunt.file.readJSON('package.json'),

            browserify: {
                standalone: {
                    src: [ 'sources/js/maperialjs/core/maperial.js' ],
                    dest: 'static/js/maperial.dev.js',
                    options: {
                        debug: true,
                        standalone: '<%= pkg.name %>'
                    }
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

            compass : {
                options : {
                    basePath : 'sources/css/'
                },
                build : {},
                watch : {
                    options : {watch: true}
                }
            },

            exec : {
                clean    : "rm -rf static/",
                tmp      : "mkdir -p static; mkdir -p static/js; mkdir -p static/css; mkdir -p static/shaders",
                cleanCss : "mv static/build-css/maperial.css static/css/maperial.css; rm -rf static/build-css/",
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
    grunt.loadNpmTasks('grunt-contrib-compass');

    /** define custom tasks */
    grunt.registerTask('css',       ['compass:build', 'exec:cleanCss']);
    grunt.registerTask('csswatch',  ['compass:watch']);
    grunt.registerTask('build',     ['browserify:standalone']);
    grunt.registerTask('clean',     ['exec:clean']);
    grunt.registerTask('jsdev',     ['build','exec:stage']);
    grunt.registerTask('jsmin',     ['build', 'uglify','exec:prod']);

    /** register custom 'deps' task */
    grunt.registerTask('dev',       ['exec:clean','exec:tmp','jsdev', 'css', 'exec:assets']);
    grunt.registerTask('min',       ['exec:clean','exec:tmp','jsmin', 'css', 'exec:assets']);

    /** default is min */
    grunt.registerTask('default',['min']);
};
