'use strict';
var _ = require('lodash/object');

function GLTools() {}

GLTools.prototype.CreateFrameBufferTex = function(gl, sizeX, sizeY, linear) {
    linear = linear || false;

    var fb = gl.createFramebuffer();
    var tex = gl.createTexture();

    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    fb.width = sizeX;
    fb.height = sizeY;

    gl.bindTexture(gl.TEXTURE_2D, tex);
    if (linear) {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
    else {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    }
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, fb.width, fb.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return [fb, tex];
};

GLTools.prototype.BuildShader = function(gl, inShader) {
    var shader = {};
    shader.error = false;
    shader.obj = null;
    shader.attributes = inShader.attributes;
    shader.parameters = inShader.parameters;

    if (inShader.type === 'x-shader/x-fragment') {
        shader.obj = gl.createShader(gl.FRAGMENT_SHADER);
    }
    else if (inShader.type === 'x-shader/x-vertex') {
        shader.obj = gl.createShader(gl.VERTEX_SHADER);
    }
    else {
        shader.error = true;
        return;
    }

    gl.shaderSource(shader.obj, inShader.code);
    gl.compileShader(shader.obj);
    if (!gl.getShaderParameter(shader.obj, gl.COMPILE_STATUS)) {
        shader.error = true;
        console.log('Build ' + inShader.name + ' : Failed ! ');
        console.log(gl.getShaderInfoLog(shader.obj));
    }
    return shader;
};

GLTools.prototype.MakeProgram = function(inVertexName, inFragmentName, inAssets) {
    if (!inAssets.shaderData) {
        console.log('invalid shader data');
        return null;
    }
    if (!(inVertexName in inAssets.shaderData)) {
        console.log(inVertexName + ' not in shader data');
        return null;
    }
    if (!(inFragmentName in inAssets.shaderData)) {
        console.log(inFragmentName + ' not in shader data');
        return null;
    }
    var vert = inAssets.shaderData[inVertexName];
    vert.name = inVertexName;

    var frag = inAssets.shaderData[inFragmentName];
    frag.name = inFragmentName;

    var gl = inAssets.ctx;
    var vertObj = this.BuildShader(gl, vert);
    var fragObj = this.BuildShader(gl, frag);

    if (vertObj.error || fragObj.error) {
        return null;
    }
    var shaderProgram = gl.createProgram();
    shaderProgram.error = false;
    shaderProgram.attr = {};
    shaderProgram.params = {};
    var attributes = {};
    var parameters = {};

    _.extend(attributes, vertObj.attributes);
    _.extend(parameters, vertObj.parameters);
    _.extend(attributes, fragObj.attributes);
    _.extend(parameters, fragObj.parameters);

    gl.attachShader(shaderProgram, vertObj.obj);
    gl.attachShader(shaderProgram, fragObj.obj);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.log('Could not link programm with ' + inVertexName + ' and ' + inFragmentName);
        shaderProgram.error = true;
        return;
    }
    gl.useProgram(shaderProgram);
    for (var key in attributes) {
        shaderProgram.attr[key] = gl.getAttribLocation(shaderProgram, attributes[key]);
    }
    for (key in parameters) {
        shaderProgram.params[key]      = {};
        shaderProgram.params[key].name = gl.getUniformLocation(shaderProgram, parameters[key][0]);
        shaderProgram.params[key].fct  = parameters[key][1];
    }
    return shaderProgram;
};

// ------------------------------------------------------------------//

module.exports = GLTools;
