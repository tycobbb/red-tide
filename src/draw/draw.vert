// -- attribs --
attribute vec4 aPos;
attribute vec2 aTexPos;
attribute vec4 aColor;

// -- uniforms --
uniform mat4 uView;
uniform mat4 uProj;

// -- props --
varying highp vec2 vTexPos;
varying lowp vec4 vColor;

// -- program --
void main() {
  gl_Position = uProj * uView * aPos;
  vTexPos = aTexPos;
  vColor = aColor;
}
