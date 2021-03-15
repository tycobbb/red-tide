// -- constants --
#define PI 3.1415926538
const float kPi4 = PI / 4.0;

// -- attribs --
attribute vec4 aPos;
attribute vec2 aTexPos;
attribute lowp float aVisible;

// -- uniforms --
uniform mat4 uView;
uniform mat4 uProj;

// -- u/style
uniform vec4 uFg;
uniform vec4 uBg;
uniform vec2 uFadeSpan;

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
  float d = distance(p0.xy, vec2(0.0, 0.0));

  // modulate based on pos along cross axis (y = -x), xc
  // xc = d * sin(pi / 4 - a)
  // TODO: not sure if this is right
  float a = asin(p0.x / d);
  float xc = sin(kPi4 - a);
  mag *= xc;

  // add wave in dir
  p.x += mag * cos(uWaveAngle);
  p.y += mag * sin(uWaveAngle);

  // interpolate colors based on distance
  float fx = uFadeSpan.x;
  float fy = uFadeSpan.y;
  // float i2 = min(max((d - 20.0) / (90.0 - 20.0), 0.0), 1.0);
  float i2 = min(max((d - fx) / (fy - fx), 0.0), 1.0);
  float i1 = 1.0 - i2;

  vec4 color = vec4(
    uFg.r * i1 + uBg.r * i2,
    uFg.g * i1 + uBg.g * i2,
    uFg.b * i1 + uBg.b * i2,
    uFg.a * i1 + uBg.a * i2
  );

  // export data
  gl_Position = p;
  vColor = color;
  vTexPos = aTexPos;
}
