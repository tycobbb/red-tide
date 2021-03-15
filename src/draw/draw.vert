// -- constants --
#define PI 3.1415926538
const float kWaveAngle = PI / 4.0;

// -- attribs --
attribute vec4 aPos;
attribute vec2 aTexPos;
attribute vec4 aColor;

// -- uniforms --
uniform mat4 uView;
uniform mat4 uProj;
uniform float uTime;

// -- props --
varying highp vec2 vTexPos;
varying lowp vec4 vColor;

// -- program --
void main() {
  // get projected position
  vec4 p = uProj * uView * aPos;

  // add wave effect
  float wav = sin(uTime) - 1.0; // range purely negative, [-2, 0]
  float mag = 4.0 * wav;
  p.x += mag * cos(kWaveAngle);
  p.y += mag * sin(kWaveAngle);

  // export data
  gl_Position = p;
  vTexPos = aTexPos;
  vColor = aColor;
}
