module.exports = function(grunt) {
    require('load-grunt-tasks')(grunt);
    require('time-grunt')(grunt);

    var gruntCfg = {
        pkg: grunt.file.readJSON('package.json'),
        env: grunt.file.readJSON('config/env/env.json'),
        documentation: "<%= env.documentation %>",

        replace: {
            dist: {
                options: {
                    patterns: [{
                        match: 'staticURL',
                        replacement: '<%= env.staticURL %>'
                    }, {
                        match: 'apiURL',
                        replacement: '<%= env.apiURL %>'
                    }, {
                        match: 'tileURL',
                        replacement: '<%= env.tileURL %>'
                    }, {
                        match: 'documentation',
                        replacement: '<%= env.documentation %>'
                    }
                    ]
                },
                files: [{
                    expand: true,
                    flatten: true,
                    src: ['config/env/config.js'],
                    dest: 'config/env/build/'
                }]
            }
        },

        browserify: {

            /* dev : simple browserify + source map */
            compile: {
                src: ['src/js/core/maperial.js'],
                dest: 'static/js/maperial.js',
                options: {
                    debug: true
                }
            },

            /* prod : build as standalone */
            standalone: {
                src: ['src/js/core/maperial.js'],
                dest: 'static/js/maperial.js',
                options: {
                    standalone: '<%= pkg.name %>'
                }
            }
        },

        uglify: {
            options: {
                banner: '/**! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
                mangle: true
            },
            build: {
                files: {
                    /* 'override.same.dest' : [source] */
                    'static/js/maperial.js': ['static/js/maperial.js']
                }
            }
        },

        sass: {
            options: {
                compass: true,
                sourcemap: true,
                quiet: true,
                style: 'compressed'
            },
            dist: {
                files: [{
                    expand: true,
                    cwd: 'src/css/sass/',
                    src: ['maperial.scss'],
                    dest: 'static/css/',
                    ext: '.css'
                }]
            }
        },

        jsdoc: {
            dist: {
                src: [
                'src/js/core/maperial.js',
                'src/js/core/map/map-view.js',
                'src/js/core/models/data/dynamical-data.js',
                'src/js/core/models/data/heatmap-data.js',
                'src/js/core/models/layers/composition.js',
                'src/js/core/models/layers/shade-layer.js',
                'src/js/core/models/layers/image-layer.js',
                ],
                options: {
                    destination: '<%= documentation %>',
                    template: "assets/jsdoc-jaguarjs",
                    configure: "config/jsdoc/config.json"
                }
            }
        },

        mochaTest: {
            test: {
                options: {
                    reporter: 'spec',
                    // tests are quite slow as thy spawn node processes
                    timeout: 10000
                },
                src: ['test/spec/**/*.js']
            },
            coverage: {
                options: {
                    reporter: 'mocha-lcov-reporter',
                    quiet: true,
                    captureFile: 'test/coverage/maperial.lcov'
                },
                src: ['test/**/*.js']
            }
        },

        coveralls: {
            options: {
                force: false
            },

            coveralls: {
                src: 'test/coverage/maperial.lcov'
            }
        },

        clean: {
            'static': 'static/',
            'shaders': 'static/shaders/',
            'shaders-dist': ['static/shaders/*', '!static/shaders/all.json'],
            'doc': '<%= documentation %>'
        },

        exec: {
            'prepare-static': "mkdir -p static; \
            mkdir -p static/js; \
            mkdir -p static/css; \
            mkdir -p static/geojson;",
            'assets': "cp -r assets/symbols static/symbols; \
            cp -r assets/images/ static/images; \
            cp assets/geojson/* static/geojson/; \
            cp src/css/vendors/* static/css/; \
            ",
            'prepare-shaders': "mkdir -p static/shaders; cp -r src/shaders/* static/shaders/",
            'build-shaders': {
                cmd: 'python mkjson.py',
                cwd: 'static/shaders'
            },
            'prepareDocIndex': "rm -f <%= documentation %>/index.html; \
            cp <%= documentation %>/Maperial.html <%= documentation %>/index.html",
            'pushDoc': {
                cmd: "git add --all .; \
                git commit -am 'generated documentation'; \
                git push origin master",
                cwd: '<%= documentation %>'
            }
        }
    };

    /** Init Project configuration. */
    grunt.initConfig(gruntCfg);

    /** js cleanup -> modify src not to tidy everything */
    // grunt.registerTask('validate', ['jscs', 'jshint']);

    /** define custom tasks */
    grunt.registerTask('test', ['mochaTest:test']);
    grunt.registerTask('coverage', ['mochaTest:coverage']);
    grunt.registerTask('css', ['sass:dist']);
    grunt.registerTask('js', ['browserify:compile']);
    grunt.registerTask('standalone', ['browserify:standalone']);
    grunt.registerTask('jsmin', ['standalone', 'uglify']);
    grunt.registerTask('shaders', [
        'clean:shaders',
        'exec:prepare-shaders',
        'exec:build-shaders',
        'clean:shaders-dist'
    ]);

    /** building jsdoc */
    grunt.registerTask('doc', [
        'clean:doc',
        'jsdoc:dist',
        'exec:prepareDocIndex',
        'exec:pushDoc'
    ]);

    /** register custom 'deps' task */
    grunt.registerTask('dev', ['clean:static', 'exec:prepare-static', 'replace', 'js', 'css', 'shaders', 'exec:assets']);
    grunt.registerTask('prod', ['clean:static', 'exec:prepare-static', 'replace', 'jsmin', 'css', 'shaders', 'exec:assets']);

    /** default is min */
    grunt.registerTask('default', ['prod']);
};
