// -- uniforms --
uniform sampler2D uSampler;

// -- props --
varying highp vec2 vTexPos;

// -- program --
void main() {
  gl_FragColor = texture2D(uSampler, vTexPos);
}
