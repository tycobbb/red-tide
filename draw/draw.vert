// -- attribs --
attribute vec4 aPos;
attribute vec2 aTexPos;

// -- uniforms --
uniform mat4 uView;
uniform mat4 uProj;

// -- props --
varying highp vec2 vTexPos;

// -- program --
void main() {
  gl_Position = uProj * uView * aPos;
  vTexPos = aTexPos;
}
