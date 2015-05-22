module.exports = function (grunt) {

    require('load-grunt-tasks')(grunt);
    require('time-grunt')(grunt);

    var gruntCfg = {
        documentation : "../../maperial.github.io/documentation",
        pkg: grunt.file.readJSON('package.json'),
        env: grunt.file.readJSON('environment/env.json'),

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
                    }]
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
                src: ['sources/js/maperialjs/core/maperial.js'],
                dest: 'static/js/maperial.js',
                options: {
                    debug: true
                }
            },

            /* prod : build as standalone */
            standalone: {
                src: ['sources/js/maperialjs/core/maperial.js'],
                dest: 'static/js/maperial.js',
                options: {
                    standalone: '<%= pkg.name %>'
                }
            },
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
                    cwd: 'sources/css/sass/',
                    src: ['maperial.scss'],
                    dest: 'static/css/',
                    ext: '.css'
                }],
            }
        },

        jsbeautifier: {
            modify: {
                src: [
                    'Gruntfile.js'
                ],
                options: {
                    config: '.jsbeautifyrc'
                }
            }
        },

        eslint: {
            target: [
                'sources/js/maperialjs/**/*.js'
            ],
        },

        jsdoc: {
            dist: {
                src: [
                    'sources/js/maperialjs/core/maperial.js',
                    'sources/js/maperialjs/core/map/map-view.js',
                    'sources/js/maperialjs/core/models/data/dynamical-data.js',
                    'sources/js/maperialjs/core/models/data/heatmap-data.js',
                    'sources/js/maperialjs/core/models/layers/composition.js',
                    'sources/js/maperialjs/core/models/layers/shade-layer.js',
                    'sources/js/maperialjs/core/models/layers/image-layer.js',
                ],
                options: {
                    destination: '<%= documentation %>',
                    template: "assets/jsdoc-jaguarjs",
                    configure: "jsdoc.conf.json"
                }
            },
        },

        exec: {
            clean: "rm -rf static/",
            tmp: "mkdir -p static; \
                            mkdir -p static/js; \
                            mkdir -p static/css; \
                            mkdir -p static/geojson; \
                            mkdir -p static/shaders",
            assets: "cp -r assets/symbols static/symbols; \
                                cp -r assets/images/ static/images; \
                            cp assets/geojson/* static/geojson/; \
                            cp sources/shaders/all.json static/shaders/all.json; \
                            cp sources/js/vendors/* static/js/; \
                            cp sources/css/vendors/* static/css/; \
                            ",
            cleanDoc: "rm -rf <%= documentation %> ",
            prepareDocIndex: "rm -f <%= documentation %>/index.html; \
                              cp <%= documentation %>/Maperial.html <%= documentation %>/index.html",
            pushDoc: {
                cmd : "git add --all .; \
                        git commit -am 'generated documentation'; \
                        git push origin master",
                cwd: '<%= documentation %>'
            },
        },

    };

    /** Init Project configuration. */
    grunt.initConfig(gruntCfg);

    /** js cleanup -> modify sources not to tidy everything */
    grunt.registerTask('tidy', ['jsbeautifier:modify']);
    grunt.registerTask('lint', ['eslint']);

    /** define custom tasks */
    grunt.registerTask('clean', ['exec:clean']);
    grunt.registerTask('css', ['sass:dist']);
    grunt.registerTask('js', ['browserify:compile']);
    grunt.registerTask('standalone', ['browserify:standalone']);
    grunt.registerTask('jsmin', ['standalone', 'uglify']);

    /** building jsdoc */
    grunt.registerTask('doc', [
        'exec:cleanDoc',
        'jsdoc:dist',
        'exec:prepareDocIndex',
        'exec:pushDoc'
    ]);

    /** register custom 'deps' task */
    grunt.registerTask('dev', ['exec:clean', 'exec:tmp', 'replace', 'js', 'css', 'exec:assets']);
    grunt.registerTask('prod', ['exec:clean', 'exec:tmp', 'replace', 'jsmin', 'css', 'exec:assets']);

    /** default is min */
    grunt.registerTask('default', ['prod']);
};