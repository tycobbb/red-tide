import "./lib/gl-matrix@3.3.0.min.js"

// -- deps --
const { mat4 } = glMatrix

// -- props -
let mCanvas = null
let mGl = null
let mSize = null
let mSimSize = null

// -- p/gl
let mBuffers = null
let mShaderDescs = null

// -- lifetime --
function main(srcs) {
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

  // init gl props
  mBuffers = initBuffers()
  mShaderDescs = initShaderDescs(srcs)

  if (mShaderDescs.draw == null) {
    return
  }

  // start loop
  loop()
}

// -- commands --
function loop() {
  draw()
  requestAnimationFrame(loop)
}

function draw() {
  const gl = mGl
  const sd = mShaderDescs.draw

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
    [-0.0, 0.0, -6.0]        // translate back 6 units
  )

  // conf how to pull pos vecs out of the pos buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, mBuffers.pos)
  gl.vertexAttribPointer(
    sd.attribs.pos,    // location
    2,                         // n components per vec
    gl.FLOAT,                  // data type of component
    false,                     // normalize?
    0,                         // stride, n bytes per item; 0 = use n components * type size (2 * 4)
    0,                         // offset, start pos in bytes
  )

  gl.enableVertexAttribArray(sd.attribs.pos)

  // conf how to pull color vecs out of the color buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, mBuffers.color)
  gl.vertexAttribPointer(
    sd.attribs.color,  // location
    4,                         // n components per vec
    gl.FLOAT,                  // data type of component
    false,                     // normalize?
    0,                         // stride, n bytes per item; 0 = use n components * type size (2 * 4)
    0,                         // offset, start pos in bytes
  )

  gl.enableVertexAttribArray(sd.attribs.color)

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

  // DRAW!
  gl.drawArrays(
    gl.TRIANGLE_STRIP,
    0, // offset
    4, // n vertices
  )
}

// -- c/buffers
function initBuffers() {
  const gl = mGl

  // create position buffer
  const pos = gl.createBuffer()

  // define shape
  const positions = [
    -1.0, 1.0,
    1.0, 1.0,
    -1.0, -1.0,
    1.0, -1.0,
  ]

  // pass data to position buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, pos)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)

  // create color buffer
  const color = gl.createBuffer()

  // define colors
  const colors = [
    1.0, 1.0, 1.0, 1.0,
    1.0, 0.0, 0.0, 1.0,
    0.0, 1.0, 0.0, 1.0,
    0.0, 0.0, 1.0, 1.0,
  ]

  // pass data to color buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, color)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW)

  // export
  return {
    pos,
    color
  }
}

// -- c/shaders
function initShaderDescs(srcs) {
  const gl = mGl

  const [
    drawVsSrc,
    drawFsSrc,
  ] = srcs

  return {
    draw: initShaderDesc(
      drawVsSrc,
      drawFsSrc,
      (program) => ({
        attribs: {
          pos: gl.getAttribLocation(program, "aPos"),
          color: gl.getAttribLocation(program, "aColor"),
        },
        uniforms: {
          view: gl.getUniformLocation(program, "uView"),
          proj: gl.getUniformLocation(program, "uProj"),
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
  // wait for the gl-matrix, the window, and the shader srcs
  const [_w, srcs] = await Promise.all([
    loadWindow(),
    loadShaders([
      "./draw/draw.vert",
      "./draw/draw.frag",
    ])
  ])

  // then start
  main(srcs)
})()

function loadWindow() {
  return new Promise((resolve) => {
    window.addEventListener("load", function listener() {
      window.removeEventListener("load", listener)
      resolve()
    })
  })
}

function loadShaders(paths) {
  return Promise.all(paths.map(async (p) => {
    const res = await fetch(p)
    const src = await res.text()
    return src
  }))
}
