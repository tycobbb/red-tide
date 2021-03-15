// -- constants --
#define PI 3.1415926538
const float kPi4 = PI / 4.0;

// -- attribs --
attribute vec4 aPos;
attribute vec2 aTexPos;
attribute vec4 aColor;

// -- uniforms --
uniform mat4 uView;
uniform mat4 uProj;

// -- u/wave
uniform float uTime;
uniform float uWaveAngle;
uniform float uWaveLength;
uniform float uWaveAmplitude;

// -- props --
varying highp vec2 vTexPos;
varying lowp vec4 vColor;

// -- program --
void main() {
  // get projected position
  vec4 p = uProj * uView * aPos;

  // calculate wave mag maximum along axis (y = x)
  float wav = sin(uWaveLength * uTime) - 1.0; // range purely negative, [-2, 0]
  float mag = uWaveAmplitude * wav;

  // modulate based on pos along cross axis (y = -x), xc
  // xc = d * sin(pi / 4 - a)
  // TODO: not sure if this is right
  float d = sqrt(pow(p.x, 2.0) + pow(p.y, 2.0));
  float a = asin(p.x / d);
  float xc = sin(kPi4 - a);
  mag *= xc;

  // add wave in dir
  p.x += mag * cos(uWaveAngle);
  p.y += mag * sin(uWaveAngle);

  // export data
  gl_Position = p;
  vTexPos = aTexPos;
  vColor = aColor;
}
