#ifdef GL_ES
precision mediump float;
#endif

attribute vec2 pos;

void main() {
    gl_Position = vec4(pos, 0, 1.0);
}
