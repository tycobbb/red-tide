import { loadEl, loadAssets } from "./load.js"
import { init as initView, draw, initData } from "./view.js"
import { init as initParticles, simulate, emit, isEmpty } from "./particles.js"

// -- constants --
const knParticles = 10
const kEmitSpeed = 2.0
const kEmitAngle = Math.PI / 4
const kEmitInterval = 10

// -- props -
let mFrame = 0

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
  update()
  draw()
  mFrame++
  requestAnimationFrame(loop)
}

function update() {
  // spawn particles
  if (!isEmpty() && mFrame % kEmitInterval == 0) {
    emit(kEmitSpeed, kEmitAngle)
  }

  // run particle simulation
  simulate()
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
