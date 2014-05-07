

module.exports = function(grunt) {

    var gruntCfg = {
            pkg : grunt.file.readJSON('package.json'),

            browserify: {
                standalone: {
                    src: [ 'sources/js/maperialjs/core/maperial.js' ],
                    dest: 'static/js/maperial.dev.js',
                    options: {
                        ignore : ['underscore', 'jsdom', 'canvas'],
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

            exec : {
                clean    : "rm -rf static/",
                tmp      : "mkdir -p static; mkdir -p static/js",
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
    grunt.registerTask('build', ['browserify:standalone']);
    grunt.registerTask('clean', ['exec:clean']);
    grunt.registerTask('jsdev', ['build']);
    grunt.registerTask('jsmin', ['build', 'uglify']);

    /** register custom 'deps' task */
    grunt.registerTask('dev', ['exec:clean','exec:tmp','jsdev']);
    grunt.registerTask('min',['exec:clean','exec:tmp','jsmin']);

    /** default is min */
    grunt.registerTask('default',['min']);
};
