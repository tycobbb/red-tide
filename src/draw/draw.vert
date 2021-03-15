// -- constants --
#define PI 3.1415926538
const float kPi4 = PI / 4.0;

// -- attribs --
attribute vec4 aPos;
attribute vec2 aTexPos;
attribute vec2 aVelocity;
attribute lowp float aVisible;

// -- uniforms --
uniform mat4 uView;
uniform mat4 uProj;

// -- u/style
uniform vec4 uFg1;
uniform vec4 uFg2;
uniform vec4 uBg;
uniform vec2 uFadeSpan;
uniform vec2 uSpeedSpan;

// -- u/wave
uniform float uTime;
uniform float uWaveAngle;
uniform float uWaveLength;
uniform float uWaveAmplitude;

// -- props --
varying highp vec2 vTexPos;
varying lowp vec4 vColor;

// -- helpers --
float unlerp(float val, vec2 span) {
   return min(max((val - span.x) / (span.y - span.x), 0.0), 1.0);
}

// -- program --
void main() {
  // ignore invisible vertices
  // if (aVisible == 0.0) {
  //   gl_Position = vec4(0.0, 0.0, 0.0, 0.0);
  //   vColor = vec4(0.0, 0.0, 0.0, 0.0);
  //   vTexPos = vec2(0.0, 0.0);
  //   return;
  // }

  // get projected position
  vec4 p0 = aPos;
  vec4 p = uProj * uView * p0;

  // calculate wave mag maximum along axis (y = x)
  float wav = sin(uWaveLength * uTime) - 1.0; // range purely negative, [-2, 0]
  float mag = uWaveAmplitude * wav;

  // get length of point
  float d = length(p0.xy);

  // modulate based on pos along cross axis (y = -x), xc
  // xc = d * sin(pi / 4 - a)
  // TODO: not sure if this is right
  float a = asin(p0.x / d);
  float xc = sin(kPi4 - a);
  mag *= xc;

  // add wave in dir
  p.x += mag * cos(uWaveAngle);
  p.y += mag * sin(uWaveAngle);

  // determine color
  vec4 color = vec4(0.0, 0.0, 0.0, 0.0);

  // interpolate fg color based on speed
  float s0 = max(unlerp(length(aVelocity), uSpeedSpan), abs(xc * wav) / 2.0);
  float s1 = 1.0 - s0;
  color += uFg1 * s0;
  color += uFg2 * s1;

  // interpolate fg/bg based on distance
  float d1 = unlerp(d, uFadeSpan);
  float d0 = 1.0 - d1;
  color *= d0;
  color += uBg * d1;

  // export data
  gl_Position = p;
  vColor = color;
  vTexPos = aTexPos;
}
