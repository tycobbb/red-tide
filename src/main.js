import { loadEl, loadAssets } from "./load.js"
import { init as initView, draw, initData } from "./view.js"
import { init as initParticles, simulate, emit, isEmpty } from "./particles.js"

// -- constants --
const knParticles = 10000
const kEmitRate = 1

const kEmitAngle = initAttr({
  min: 0.0,
  max: Math.PI / 2,
  crv: (s, f) => Math.pow(s, 2),
})

const kEmitSpeed = initAttr({
  min: 0.01,
  max: 0.05,
  crv: (s, f) => Math.pow(s, 2),
})

// -- props -
let mFrame = 0
let mTime = null

// -- lifetime --
function main(assets) {
  console.debug("start")

  // initialize
  initData(knParticles)
  initParticles(knParticles)
  initView(assets)

  // start loop
  loop()
}

// -- commands --
function loop() {
  mTime = performance.now() / 1000
  update()
  draw(mTime)
  mFrame++
  requestAnimationFrame(loop)
}

function update() {
  // spawn particles
  if (!isEmpty() && mFrame % kEmitRate == 0) {
    emit(getSpeed(), getAngle())
  }

  // run particle simulation
  simulate()
}

// -- queries --
function getSpeed() {
  return kEmitSpeed.sample(mFrame)
}

function getAngle() {
  return kEmitAngle.sample(mFrame)
}

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

// -- boostrap --
(async function load() {
  // wait for the window and all assets
  const [_w, assets] = await Promise.all([
    loadEl(window),
    loadAssets({
      textures: {
        tide: "./assets/tide.png",
      },
      shaders: {
        draw: {
          vert: "./src/draw/draw.vert",
          frag: "./src/draw/draw.frag",
        },
      },
    }),
  ])

  // then start
  main(assets)
})()
