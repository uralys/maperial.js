module.exports = function (grunt) {

    require('load-grunt-tasks')(grunt);
    require('time-grunt')(grunt);

    var gruntCfg = {
        pkg: grunt.file.readJSON('package.json'),
        env: grunt.file.readJSON('config/env/env.json'),
        documentation : "<%= env.documentation %>",

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
                src: ['src/js/maperialjs/core/maperial.js'],
                dest: 'static/js/maperial.js',
                options: {
                    debug: true
                }
            },

            /* prod : build as standalone */
            standalone: {
                src: ['src/js/maperialjs/core/maperial.js'],
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
                    cwd: 'src/css/sass/',
                    src: ['maperial.scss'],
                    dest: 'static/css/',
                    ext: '.css'
                }],
            }
        },

        jsdoc: {
            dist: {
                src: [
                    'src/js/maperialjs/core/maperial.js',
                    'src/js/maperialjs/core/map/map-view.js',
                    'src/js/maperialjs/core/models/data/dynamical-data.js',
                    'src/js/maperialjs/core/models/data/heatmap-data.js',
                    'src/js/maperialjs/core/models/layers/composition.js',
                    'src/js/maperialjs/core/models/layers/shade-layer.js',
                    'src/js/maperialjs/core/models/layers/image-layer.js',
                ],
                options: {
                    destination: '<%= documentation %>',
                    template: "assets/jsdoc-jaguarjs",
                    configure: "config/jsdoc/config.json"
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
                            cp src/shaders/all.json static/shaders/all.json; \
                            cp src/js/vendors/* static/js/; \
                            cp src/css/vendors/* static/css/; \
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

    /** js cleanup -> modify src not to tidy everything */
    // grunt.registerTask('validate', ['jscs', 'jshint']);

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
