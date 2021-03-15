// -- style --
export const kParticleSize = {
  w: 4.0,
  h: 4.0
}

// -- s/color
export const kGreen = new Float32Array([0.28, 0.30, 0.29, 1.00])
export const kRed1 = new Float32Array([1.00, 1.00, 1.00, 1.00])
export const kRed2 = new Float32Array([1.00, 1.00, 1.00, 1.00])

// -- s/anim --
export const kFadeSpan = [10.0, 40.0]
export const kSpeedSpan = [0.0, 0.1]


// -- screen --
export const kSourceX = 0.0
export const kSourceY = 0.0

// when z = -60, x,y = -25 places the origin in the bottom-left corner
// TODO: what is the math here?
export const kCameraX = -35.0
export const kCameraY = -35.0
export const kCameraZ = -60.0
export const kCameraPos = [kCameraX, kCameraY, kCameraZ]

// -- physics --
export const knParticles = 1000
export const kDrag = 0.999

// -- p/wave
export const kWaveAngle = Math.PI / 4.0
export const kWaveLength = Math.PI / 2.0
export const kWaveAmplitude = 2.0

// -- p/emit
export const kEmitRate = 2

export const kEmitAngle = initAttr({
  min: 0,
  max: kWaveAngle * 2,
  crv: (s, f) => Math.pow(s, 2),
})

export const kEmitSpeed = initAttr({
  min: 0.20,
  max: 0.80,
  crv: (s, f) => Math.pow(s, 2),
})

// -- helpers --
function initAttr(props) {
  return {
    ...props,
    get len() {
      return this.max - this.min
    },
    sample(frame) {
      return this.min + this.crv(Math.random(), frame) * this.len
    }
  }
}
