attribute vec4 pos;
attribute vec4 color;

uniform mat4 view;
uniform mat4 proj;

varying lowp vec4 vcolor;

void main() {
  gl_Position = proj * view * pos;
  vcolor = color;
}
