import "../lib/gl-matrix@3.3.0.min.js"
import {
  kCameraPos,
  kRed1,
  kRed2,
  kGreen,
  kFadeSpan,
  kSpeedSpan,
  kWaveAngle,
  kWaveLength,
  kWaveAmplitude
} from "./constants.js"

// -- deps --
const { mat4 } = glMatrix

// -- c/gl
const knVerts = 4
const knPos = 8
const knTexPos = 8
const knVelocity = 8
const knVisible = 1
const knIndices = 6

// -- props -
let mCanvas = null
let mGl = null
let mSize = null

// -- p/gl
let mBuffers = null
let mTextures = null
let mShaderDescs = null

// -- p/gl/arrays
let dnPos = null
let dPos = null
let dnTexPos = null
let dTexPos = null
let dnVelocity = null
let dVelocity = null
let dnVisible = null
let dVisible = null
let dnIndices = null
let dIndices = null

// -- lifetime --
export function initData(len) {
  // TODO: how to conserve gl memory here? instanced drawing?
  dnPos = knPos * len
  dPos = new Float32Array(dnPos)

  dnTexPos = knTexPos * len
  dTexPos = new Float32Array(dnTexPos)

  dnVelocity = knVelocity * len
  dVelocity = new Float32Array(dnVelocity)

  dnVisible = knVisible * len
  dVisible = new Uint8Array(dnVisible)

  dnIndices = knIndices * len
  dIndices = new Uint16Array(dnIndices)
}

export function init(assets) {
  // grab canvas/context
  mCanvas = document.getElementById("canvas")
  if (mCanvas == null) {
    console.error("failed to find canvas")
    return false
  }

  mGl = mCanvas.getContext("webgl", { alpha: false })
  if (mGl == null) {
    console.error("where is webgl NOW~!")
    return false
  }

  mSize = initSize(
    Number.parseInt(mCanvas.getAttribute("width")),
    Number.parseInt(mCanvas.getAttribute("height")),
  )

  // init gl drawing props
  mBuffers = initBuffers()
  mTextures = initTextures(assets.textures)
  mShaderDescs = initShaderDescs(assets.shaders)

  if (mShaderDescs.draw == null) {
    return false
  }

  return true
}

// -- commands --
export function draw(time) {
  const gl = mGl
  const sd = mShaderDescs.draw

  // set blend mode
  // https://limnu.com/webgl-blending-youre-probably-wrong/
  // https://stackoverflow.com/questions/39341564/webgl-how-to-correctly-blend-alpha-channel-png
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

  // background color
  gl.clearColor(...kGreen)

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
    kCameraPos,
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

  // update velocity buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, mBuffers.velocity)
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, dVelocity)
  gl.vertexAttribPointer(
    sd.attribs.velocity,    // location
    2,                 // n components per vec
    gl.FLOAT,          // data type of component
    false,             // normalize?
    0,                 // stride, n bytes per item; 0 = use n components * type size (2 * 4)
    0,                 // offset, start pos in bytes
  )

  gl.enableVertexAttribArray(sd.attribs.velocity)

  // update "visible" buffer
  // gl.bindBuffer(gl.ARRAY_BUFFER, mBuffers.visible)
  // gl.bufferSubData(gl.ARRAY_BUFFER, 0, dVisible)
  // gl.vertexAttribPointer(
  //   sd.attribs.visible, // location
  //   1,                  // n components per vec
  //   gl.UNSIGNED_BYTE,   // data type of component
  //   false,               // normalize?
  //   0,                  // stride, n bytes per item; 0 = use n components * type size (2 * 4)
  //   0,                  // offset, start pos in bytes
  // )

  // gl.enableVertexAttribArray(sd.attribs.visible)

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

  // conf style uniforms
  gl.uniform4fv(sd.uniforms.fgColor1, kRed1)
  gl.uniform4fv(sd.uniforms.fgColor2, kRed2)
  gl.uniform4fv(sd.uniforms.bgColor, kGreen)
  gl.uniform2fv(sd.uniforms.fadeSpan, kFadeSpan)
  gl.uniform2fv(sd.uniforms.speedSpan, kSpeedSpan)

  // conf wave uniforms
  gl.uniform1f(sd.uniforms.time, time)
  gl.uniform1f(sd.uniforms.waveAngle, kWaveAngle)
  gl.uniform1f(sd.uniforms.waveLength, kWaveLength)
  gl.uniform1f(sd.uniforms.waveAmplitude, kWaveAmplitude)

  // conf texture uniform
  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, mTextures.cell)
  gl.uniform1i(sd.uniforms.sampler, 0)

  // draw everything using vertex indices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mBuffers.indices)
  gl.drawElements(
    gl.TRIANGLES,
    dnIndices,         // n vertices
    gl.UNSIGNED_SHORT, // type (of index)
    0,                 // offset
  )
}

export function setPos(i, values) {
  dPos.set(
    values,
    i * knPos,
  )
}

export function setTexPos(i, values) {
  dTexPos.set(
    values,
    i * knTexPos,
  )
}

export function setVelocity(i, values) {
  dVelocity.set(
    values,
    i * knVelocity,
  )
}

export function setVisible(i, visible) {
  dVisible.set(
    visible,
    i * knVisible,
  )
}

export function setIndices(i, indices) {
  // offset the indices
  const di = i * knVerts
  for (let j = 0; j < knIndices; j++) {
    indices[j] += di
  }

  // update data
  dIndices.set(
    indices,
    i * knIndices,
  )
}

// -- initialization --
// -- i/buffers
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

  // create velocity buffer
  const velocity = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, velocity)
  gl.bufferData(gl.ARRAY_BUFFER, dVelocity, gl.DYNAMIC_DRAW)

  // create "visible" buffer
  const visible = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, visible)
  gl.bufferData(gl.ARRAY_BUFFER, dVisible, gl.DYNAMIC_DRAW)

  // create index buffer
  const indices = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, dIndices, gl.STATIC_DRAW)

  // export
  return {
    pos,
    texPos,
    velocity,
    visible,
    indices,
  }
}

// -- i/textures
function initTextures(srcs) {
  return {
    cell: initTexture(srcs.cell),
  }
}

function initTexture(img) {
  const gl = mGl

  // create texture
  const tex = gl.createTexture()

  // conf texture
  gl.bindTexture(gl.TEXTURE_2D, tex)

  // premultiply alpha
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)

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

  // and enable trilinear filtering
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

  return tex
}

// -- i/shaders
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
          velocity: gl.getAttribLocation(program, "aVelocity"),
          visible: gl.getAttribLocation(program, "aVisible"),
        },
        uniforms: {
          view: gl.getUniformLocation(program, "uView"),
          proj: gl.getUniformLocation(program, "uProj"),
          time: gl.getUniformLocation(program, "uTime"),
          fgColor1: gl.getUniformLocation(program, "uFg1"),
          fgColor2: gl.getUniformLocation(program, "uFg2"),
          bgColor: gl.getUniformLocation(program, "uBg"),
          fadeSpan: gl.getUniformLocation(program, "uFadeSpan"),
          speedSpan: gl.getUniformLocation(program, "uSpeedSpan"),
          waveAngle: gl.getUniformLocation(program, "uWaveAngle"),
          waveLength: gl.getUniformLocation(program, "uWaveLength"),
          waveAmplitude: gl.getUniformLocation(program, "uWaveAmplitude"),
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

// -- helpers --
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
