

module.exports = function(grunt) {

    var gruntCfg = {
            pkg : grunt.file.readJSON('package.json'),
            env : grunt.file.readJSON('environment/env.json'),

            replace: {
                dist: {
                    options: {
                        patterns: [
                            {
                               match: 'staticURL',
                               replacement: '<%= env.staticURL %>'
                            },
                            {
                               match: 'apiURL',
                               replacement: '<%= env.apiURL %>'
                            },
                            {
                               match: 'tileURL',
                               replacement: '<%= env.tileURL %>'
                            }
                        ]
                    },
                    files: [{
                        expand: true,
                        flatten: true,
                        src: ['environment/config.js'],
                        dest: 'sources/js/environment/'
                    }]
                }
            },

            browserify: {

                /* dev : simple browserify + source map */
                compile: {
                    src: [ 'sources/js/maperialjs/core/maperial.js' ],
                    dest: 'static/js/maperial.js',
                    options: {
                        debug : true
                    }
                },

                /* prod : build as standalone */
                standalone: {
                    src: [ 'sources/js/maperialjs/core/maperial.js' ],
                    dest: 'static/js/maperial.js',
                    options: {
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
                        /* 'override.same.dest' : [source] */
                        'static/js/maperial.js' : ['static/js/maperial.js']
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
                assets   : "cp -r assets/symbols static/symbols; \
                            cp sources/shaders/all.json static/shaders/all.json; \
                            cp sources/js/vendors/* static/js/; \
                            cp sources/css/vendors/* static/css/; \
                            ",
            },

    };

    /** Init Project configuration. */
    grunt.initConfig(gruntCfg);

    /** load plugin tasks */
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-replace');
    grunt.loadNpmTasks('grunt-exec');
    grunt.loadNpmTasks('grunt-contrib-sass');

    /** define custom tasks */
    grunt.registerTask('clean',     ['exec:clean']);
    grunt.registerTask('css',       ['sass:dist']);
    grunt.registerTask('js',        ['browserify:compile']);
    grunt.registerTask('standalone',['browserify:standalone']);
    grunt.registerTask('jsmin',     ['standalone', 'uglify']);

    /** register custom 'deps' task */
    grunt.registerTask('dev',       ['exec:clean','exec:tmp', 'replace', 'js',      'css', 'exec:assets']);
    grunt.registerTask('prod',      ['exec:clean','exec:tmp', 'replace', 'jsmin',   'css', 'exec:assets']);

    /** default is min */
    grunt.registerTask('default', ['prod']);
};
