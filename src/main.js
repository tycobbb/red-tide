import "../lib/gl-matrix@3.3.0.min.js"
import { repeat } from "./utils.js"

// -- deps --
const { mat4 } = glMatrix

// -- constants --
const kCameraZ = -60.0
const kEmitX = -25.0
const kEmitY = -25.0
const kEmitSpeed = 2.0
const kEmitAngle = Math.PI / 4
const kEmitDrag = 0.97

// -- c/gl
const knParticles = 10
const knVerts = 4
const knPos = 8
const knPosLen = knPos * knParticles
const knTexPos = 8
const knTexPosLen = knTexPos * knParticles
const knColors = 16
const knColorsLen = knColors * knParticles
const knIndices = 6
const knIndicesLen = knIndices * knParticles

// -- c/style
const kRed = [0.86, 0.39, 0.37, 1.00]
const kRedQuad = repeat(4, kRed)
const kClear = [0.00, 0.00, 0.00, 0.00]
const kClearQuad = repeat(4, kClear)
const kTexQuad = [
  0.0, 0.0,
  1.0, 0.0,
  1.0, 1.0,
  0.0, 1.0
]

// -- props -
let mCanvas = null
let mGl = null
let mSize = null
let mFrame = 0

// -- p/emitter
let mEmitter = null

// -- p/gl
let mBuffers = null
let mTextures = null
let mShaderDescs = null

// -- p/gl/data
// TODO: how to conserve gl memory here? instanced drawing?
const dPos = new Float32Array(knPosLen)
const dTexPos = new Float32Array(knTexPosLen)
const dColors = new Float32Array(knColorsLen)
const dIndices = new Uint16Array(knIndicesLen)

// -- lifetime --
function main(assets) {
  // set props
  mCanvas = document.getElementById("canvas")
  if (mCanvas == null) {
    console.error("failed to find canvas")
    return
  }

  mGl = mCanvas.getContext("webgl")
  if (mGl == null) {
    console.error("where is webgl NOW~!")
    return
  }

  mSize = initSize(
    Number.parseInt(mCanvas.getAttribute("width")),
    Number.parseInt(mCanvas.getAttribute("height")),
  )

  // init emitter
  mEmitter = initEmitter()

  // init gl props
  mBuffers = initBuffers()
  mTextures = initTextures(assets.textures)
  mShaderDescs = initShaderDescs(assets.shaders)

  if (mShaderDescs.draw == null) {
    return
  }

  // start loop
  loop()
}

// -- commands --
function loop() {
  update()
  draw()
  requestAnimationFrame(loop)
  mFrame++
}

function update() {
  // spawn particles
  if (mFrame % 10) {
    mEmitter.emit(kEmitSpeed, kEmitAngle)
  }

  // run particle simulation
  mEmitter.update()
}

function draw() {
  const gl = mGl
  const sd = mShaderDescs.draw

  // set blend mode
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  // background color, black
  gl.clearColor(0.0, 0.0, 0.0, 1.0)

  // enable depth testing, near > far
  gl.clearDepth(1.0)
  gl.enable(gl.DEPTH_TEST)
  gl.depthFunc(gl.LEQUAL)

  // clear canvas
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  // create perspective matrix
  const proj = mat4.create()
  mat4.perspective(
    proj,
    45.0 * Math.PI / 180.0, // fov
    mSize.w / mSize.h,      // aspect ratio
    0.1,                    // near plane
    100.0                   // far plane
  )

  // create view matrix
  const view = mat4.create()
  mat4.translate(
    view,
    view,
    [0.0, 0.0, kCameraZ]  // translate back n units
  )

  // update pos buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, mBuffers.pos)
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, dPos)
  gl.vertexAttribPointer(
    sd.attribs.pos,    // location
    2,                 // n components per vec
    gl.FLOAT,          // data type of component
    false,             // normalize?
    0,                 // stride, n bytes per item; 0 = use n components * type size (2 * 4)
    0,                 // offset, start pos in bytes
  )

  gl.enableVertexAttribArray(sd.attribs.pos)

  // update tex pos buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, mBuffers.texPos)
  gl.vertexAttribPointer(
    sd.attribs.texPos, // location
    2,                 // n components per vec
    gl.FLOAT,          // data type of component
    false,             // normalize?
    0,                 // stride, n bytes per item; 0 = use n components * type size (2 * 4)
    0,                 // offset, start pos in bytes
  )

  gl.enableVertexAttribArray(sd.attribs.texPos)

  // update vert color buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, mBuffers.colors)
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, dColors)
  gl.vertexAttribPointer(
    sd.attribs.color, // location
    4,                // n components per vec
    gl.FLOAT,         // data type of component
    false,            // normalize?
    0,                // stride, n bytes per item; 0 = use n components * type size (2 * 4)
    0,                // offset, start pos in bytes
  )

  gl.enableVertexAttribArray(sd.attribs.colors)

  // conf shader program
  gl.useProgram(sd.program)

  // conf shader uniforms
  gl.uniformMatrix4fv(
    sd.uniforms.proj,
    false,
    proj,
  )

  gl.uniformMatrix4fv(
    sd.uniforms.view,
    false,
    view,
  )

  gl.uniform4fv(
    sd.uniforms.color,
    kRed,
  )

  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, mTextures.tide)
  gl.uniform1i(sd.uniforms.sampler, 0)

  // draw everything using vertex indices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mBuffers.indices)
  gl.drawElements(
    gl.TRIANGLES,
    knIndicesLen,      // n vertices
    gl.UNSIGNED_SHORT, // type (of index)
    0,                 // offset
  )
}

// -- c/particles
function initEmitter() {
  // props
  const mParticles = new Array(knParticles)
  const mFree = new Set(mParticles.keys())
  const mX = kEmitX
  const mY = kEmitY

  // private
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

  // define emitter
  const emitter = {
    init() {
      for (let i = 0; i < knParticles; i++) {
        // init particle
        mParticles[i] = initParticle(i)

        // sync gl vert data
        this.syncPos(i)
        this.syncColors(i)

        // seed static gl data
        dTexPos.set(
          kTexQuad,
          i * knTexPos,
        )

        const di = i * knVerts
        dIndices.set([
          di + 0, di + 1, di + 2,
          di + 0, di + 2, di + 3,
        ], i * knIndices)
      }
    },
    // -- loop --
    update() {
      for (let i = 0; i < knParticles; i++) {
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
        p.vx *= kEmitDrag
        if (Math.abs(p.vx) <= 0.01) {
          p.vx = 0.0
        }

        p.vy *= kEmitDrag
        if (Math.abs(p.vy) <= 0.01) {
          p.vy = 0.0
        }

        this.syncPos(i)
      }
    },
    // -- comamnds --
    emit(speed, radians) {
      const i = mFree.keys().next().value
      if (i == null) {
        // console.error("tried to fire a particle but there were none available")
        return
      }

      // enable this particle
      this.setOn(i, true)

      // update its initial velocity
      const p = mParticles[i]
      p.x = mX
      p.y = mY
      p.vx = speed * Math.cos(radians)
      p.vy = speed * Math.sin(radians)

      this.syncPos(i)
    },
    move(i, dx, dy) {
      const p = mParticles[i]
      if (!p.on) {
        return
      }

      p.x += dx
      p.y += dy

      this.syncPos(i)
    },
    setOn(i, on) {
      const p = mParticles[i]
      p.on = on

      // track in free index set
      if (on) {
        mFree.delete(i)
      } else {
        mFree.add(i)
      }

      this.syncColors(i)
    },
    syncPos(i) {
      const p = mParticles[i]
      const x = p.x
      const y = p.y
      const w2 = p.w / 2.0
      const h2 = p.h / 2.0

      dPos.set([
        x - w2, y + h2,
        x - w2, y - h2,
        x + w2, y - h2,
        x + w2, y + h2,
      ], i * knPos)
    },
    syncColors(i) {
      const p = mParticles[i]
      const offset = i * knColors

      if (p.on) {
        dColors.set(kRedQuad, offset)
      } else {
        dColors.set(kClearQuad, offset)
      }
    }
  }

  // initialize particles
  emitter.init()

  return emitter
}

// -- c/buffers
function initBuffers() {
  const gl = mGl

  // create position buffer
  const pos = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, pos)
  gl.bufferData(gl.ARRAY_BUFFER, dPos, gl.DYNAMIC_DRAW)

  // create texture buffer
  const texPos = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, texPos)
  gl.bufferData(gl.ARRAY_BUFFER, dTexPos, gl.STATIC_DRAW)

  // create vert color buffer
  const colors = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, colors)
  gl.bufferData(gl.ARRAY_BUFFER, dColors, gl.DYNAMIC_DRAW)

  // create index buffer
  const indices = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, dIndices, gl.STATIC_DRAW)

  // export
  return {
    pos,
    texPos,
    colors,
    indices,
  }
}

// -- c/textures
function initTextures(srcs) {
  return {
    tide: initTexture(srcs.tide),
  }
}

function initTexture(img) {
  const gl = mGl

  // create texture
  const tex = gl.createTexture()

  // conf texture
  gl.bindTexture(gl.TEXTURE_2D, tex)

  // set texture data
  gl.texImage2D(
    gl.TEXTURE_2D,    // target
    0,                // lod, mipmap
    gl.RGBA,          // color component format
    gl.RGBA,          // texel format
    gl.UNSIGNED_BYTE, // component data type
    img,              // source
  )

  // generate mipmaps for this image, (must be power of 2)
  gl.generateMipmap(gl.TEXTURE_2D);

  return tex
}

// -- c/shaders
function initShaderDescs(srcs) {
  const gl = mGl

  // grab srcs
  const vsSrc = srcs.draw.vert
  const fsSrc = srcs.draw.frag

  // build shader descriptions
  return {
    draw: initShaderDesc(
      vsSrc,
      fsSrc,
      (program) => ({
        attribs: {
          pos: gl.getAttribLocation(program, "aPos"),
          texPos: gl.getAttribLocation(program, "aTexPos"),
          color: gl.getUniformLocation(program, "aColor"),
        },
        uniforms: {
          view: gl.getUniformLocation(program, "uView"),
          proj: gl.getUniformLocation(program, "uProj"),
          sampler: gl.getUniformLocation(program, "uSampler"),
        },
      })
    ),
  }
}

function initShaderDesc(vsSrc, fsSrc, locations) {
  // create program
  const program = initShaderProgram(vsSrc, fsSrc)
  if (program == null) {
    return null
  }

  // tag program with locations for shader props (if js could map optionals...)
  return {
    program,
    ...locations(program)
  }
}

function initShaderProgram(vsSrc, fsSrc) {
  const gl = mGl

  // init vertex and fragment shaders
  const vs = initShader(gl.VERTEX_SHADER, vsSrc)
  if (vs == null) {
    return null
  }

  const fs = initShader(gl.FRAGMENT_SHADER, fsSrc)
  if (fs == null) {
    return null
  }

  // create program
  const program = gl.createProgram();
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)

  // check for errors
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("failed to initialize shader program:", gl.getProgramInfoLog(program))
    return null
  }

  return program
}

function initShader(type, src) {
  const gl = mGl

  // create shader
  const shader = gl.createShader(type);

  // compile source
  gl.shaderSource(shader, src)
  gl.compileShader(shader);

  // check for errors
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("failed to compile shader:", gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }

  return shader
}

// -- c/helpers
function initSize(w, h) {
  return {
    v: new Float32Array([w, h]),
    get w() {
      return this.v[0]
    },
    get h() {
      return this.v[1]
    }
  }
}

// -- boostrap --
(async function load() {
  // wait for the window and all assets
  const [_w, assets] = await Promise.all([
    loadWindow(),
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

function loadWindow() {
  return load(window)
}

function load(el) {
  return new Promise((resolve) => {
    el.addEventListener("load", function listener() {
      el.removeEventListener("load", listener)
      resolve()
    })
  })
}

async function loadAssets(assets) {
  // mirror the asset structure
  const memo = {}

  // flatten assets into list of [keypath, path]
  const keypaths = makeKeypaths(assets)

  // fetch all the assets
  const promises = keypaths.map(async ([keypath, path]) => {
    // fetch asset
    const res = await fetch(path)
    const val = await parseAsset(res)

    // write the val back to the correct spot in memo
    const n = keypath.length

    let obj = memo
    for (let i = 0; i < n - 1; i++) {
      const key = keypath[i]
      if (obj[key] == null) {
        obj = obj[key] = {}
      } else {
        obj = obj[key]
      }
    }

    // make sure to merge any props
    obj[keypath[n - 1]] = val

    // return val
    return val
  })

  // wait for all the promises to finish
  await Promise.all(promises)

  // and return the mirrored structure
  return memo
}

function parseAsset(res) {
  switch (res.headers.get("Content-Type")) {
    case "image/png":
      return parseImage(res)
    default: // plain/text, shader
      return res.text()
  }
}

async function parseImage(res) {
  const blob = await res.blob()

  // build img element
  const img = new Image()
  img.src = URL.createObjectURL(blob)

  // wait for it to load; local so it should be 1-frame?
  await load(img)

  return img
}

function makeKeypaths(paths) {
  const entries = []

  for (const key in paths) {
    const val = paths[key]

    if (!(val instanceof Object)) {
      entries.push([[key], val])
    } else {
      const nested = makeKeypaths(val)

      for (const entry of nested) {
        entry[0].unshift(key)
      }

      entries.push(...nested)
    }
  }

  return entries
}
