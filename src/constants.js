// -- style --
export const kGreen = [0.43, 0.56, 0.48, 1.00]
export const kRed = [0.86, 0.39, 0.37, 1.00]
export const kClear = [0.00, 0.00, 0.00, 0.00]

// -- screen --
export const kSourceX = 0.0
export const kSourceY = 0.0

// when z = -60, x,y = -25 places the origin in the bottom-left corner
// TODO: what is the math here?
export const kCameraX = -30.0
export const kCameraY = -30.0
export const kCameraZ = -60.0
export const kCameraPos = [kCameraX, kCameraY, kCameraZ]

// -- physics --
export const knParticles = 10000
export const kDrag = 0.999

// -- p/wave
export const kWaveAngle = Math.PI / 4.0
export const kWaveLength = Math.PI / 2.0
export const kWaveAmplitude = 2.0

// -- p/emit
export const kEmitRate = 1
export const kEmitAngle = initAttr({
  min: 0,
  max: kWaveAngle * 2,
  crv: (s, f) => Math.pow(s, 2),
})

export const kEmitSpeed = initAttr({
  min: 0.01,
  max: 0.05,
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
