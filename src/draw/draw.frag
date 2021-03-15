// -- uniforms --
uniform sampler2D uSampler;

// -- props --
varying highp vec2 vTexPos;
varying lowp vec4 vColor;

// -- program --
void main() {
  gl_FragColor = texture2D(uSampler, vTexPos) * vColor;
}
