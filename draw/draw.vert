// -- attribs --
attribute vec4 aPos;
attribute vec4 aColor;

// -- uniforms --
uniform mat4 uView;
uniform mat4 uProj;

// -- props --
varying lowp vec4 vcolor;

// -- program --
void main() {
  gl_Position = uProj * uView * aPos;
  vcolor = aColor;
}
