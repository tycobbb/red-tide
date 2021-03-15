import { repeat } from "./utils.js"
import { kSourceX, kSourceY, kDrag, kRed, kClear } from "./constants.js"
import { setPos, setTexPos, setColors, setIndices } from "./view.js"

// -- constants --
const kRedQuad = repeat(4, kRed)
const kClearQuad = repeat(4, kClear)
const kTexQuad = [
  0.0, 0.0,
  1.0, 0.0,
  1.0, 1.0,
  0.0, 1.0
]

// -- props --
let mLen = null
let mParticles = null
let mFree = null
let mX = null
let mY = null

let mDebug

// -- lifetime --
export function init(len) {
  mLen = len
  mParticles = new Array(len)
  mFree = new Set(mParticles.keys())
  mX = kSourceX
  mY = kSourceY

  // initialize particles
  for (let i = 0; i < len; i++) {
    // init particle
    mParticles[i] = initParticle(i)

    // sync gl vert data
    syncPos(i)
    syncColors(i)

    // seed static gl data
    setTexPos(i,
      kTexQuad
    )

    setIndices(i, [
      0, 1, 2,
      0, 2, 3,
    ])
  }
}

function initParticle(i) {
  return {
    x: mX,
    y: mY,
    w: 1.0,
    h: 1.0,
    vx: 0.0,
    vy: 0.0,
    on: false,
  }
}

// -- commands --
export function simulate() {
  for (let i = 0; i < mLen; i++) {
    const p = mParticles[i]
    if (!p.on) {
      continue
    }

    if (p.vx == 0 && p.vy == 0) {
      continue
    }

    // update position
    p.x += p.vx
    p.y += p.vy

    // decay velocity
    p.vx *= kDrag
    p.vy *= kDrag

    if (p.vx + p.vy <= 0.001) {
      p.vx = 0
      p.vy = 0
    }

    syncPos(i)
  }
}

export function emit(speed, radians) {
  const i = mFree.keys().next().value
  if (i == null) {
    console.error("tried to fire a particle but there were none available")
    return
  }

  // enable this particle
  setOn(i, true)

  // update its initial velocity
  const p = mParticles[i]
  p.x = mX
  p.y = mY
  p.vx = speed * Math.cos(radians)
  p.vy = speed * Math.sin(radians)

  syncPos(i)
}

// -- c/helpers
function setOn(i, on) {
  const p = mParticles[i]
  p.on = on

  // track in free index set
  if (on) {
    mFree.delete(i)
  } else {
    mFree.add(i)
  }

  syncColors(i)
}

function syncPos(i) {
  const p = mParticles[i]

  const x = p.x
  const y = p.y
  const w2 = p.w / 2.0
  const h2 = p.h / 2.0
  const x0 = x - w2
  const x1 = x + w2
  const y0 = y - h2
  const y1 = y + h2

  setPos(i, [
    x0, y1,
    x0, y0,
    x1, y0,
    x1, y1,
  ])
}

function syncColors(i) {
  const p = mParticles[i]

  if (p.on) {
    setColors(i, kRedQuad)
  } else {
    setColors(i, kClearQuad)
  }
}

// -- queries --
export function isEmpty() {
  return mFree.size === 0
}
