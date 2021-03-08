async function main(srcs) {
  // start program
  const canvas = document.getElementById("canvas")
  const gl = canvas.getContext("webgl")

  if (gl === null) {
    alert("where is webgl NOW~!")
    return
  }

  const buffers = initBuffers(
    gl,
  )

  const [vs, fs] = srcs
  const shaderDesc = initShaderDesc(
    gl,
    vs,
    fs,
  )

  if (shaderDesc != null) {
    drawScene(gl, shaderDesc, buffers)
  }
}

function drawScene(gl, shaderDesc, buffers) {
  // background color, black
  gl.clearColor(0.0, 0.0, 0.0, 1.0)

  // enable depth testing, near > far
  gl.clearDepth(1.0)
  gl.enable(gl.DEPTH_TEST)
  gl.depthFunc(gl.LEQUAL)

  // clear canvas
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  // create perspective matrix
  const proj = glMatrix.mat4.create()

  const {
    clientWidth: w,
    clientHeight: h
  } = gl.canvas

  glMatrix.mat4.perspective(
    proj,
    45.0 * Math.PI / 180.0, // fov
    w / h,                  // aspect ratio
    0.1,                    // near plane
    100.0                   // far plane
  )

  // create view matrix
  const view = glMatrix.mat4.create()

  glMatrix.mat4.translate(
    view,
    view,
    [-0.0, 0.0, -6.0]        // translate back 6 units
  )

  // conf how to pull pos vecs out of the pos buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.pos)
  gl.vertexAttribPointer(
    shaderDesc.attribs.pos,    // location
    2,                         // n components per vec
    gl.FLOAT,                  // data type of component
    false,                     // normalize?
    0,                         // stride, n bytes per item; 0 = use n components * type size (2 * 4)
    0,                         // offset, start pos in bytes
  )

  gl.enableVertexAttribArray(shaderDesc.attribs.pos)

  // conf how to pull color vecs out of the color buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color)
  gl.vertexAttribPointer(
    shaderDesc.attribs.color,  // location
    4,                         // n components per vec
    gl.FLOAT,                  // data type of component
    false,                     // normalize?
    0,                         // stride, n bytes per item; 0 = use n components * type size (2 * 4)
    0,                         // offset, start pos in bytes
  )

  gl.enableVertexAttribArray(shaderDesc.attribs.color)

  // conf shader program
  gl.useProgram(shaderDesc.program)

  // conf shader uniforms
  gl.uniformMatrix4fv(
    shaderDesc.uniforms.proj,
    false,
    proj,
  )

  gl.uniformMatrix4fv(
    shaderDesc.uniforms.view,
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

function initBuffers(gl) {
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

function initShaderDesc(gl, vsSrc, fsSrc) {
  const program = initShaderProgram(gl, vsSrc, fsSrc)
  if (program == null) {
    return null
  }

  return {
    program,
    attribs: {
      pos: gl.getAttribLocation(program, "pos"),
      color: gl.getAttribLocation(program, "color"),
    },
    uniforms: {
      view: gl.getUniformLocation(program, "view"),
      proj: gl.getUniformLocation(program, "proj"),
    },
  }
}

function initShaderProgram(gl, vsSrc, fsSrc) {
  // init vertex and fragment shaders
  const vs = initShader(gl, gl.VERTEX_SHADER, vsSrc)
  if (vs == null) {
    return null
  }

  const fs = initShader(gl, gl.FRAGMENT_SHADER, fsSrc)
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

function initShader(gl, type, src) {
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

// -- boostrap --
(async function load() {
  // wait for the gl-matrix, the window, and the shader srcs
  const [_m, _w, srcs] = await Promise.all([
    import("./lib/gl-matrix@3.3.0.min.js"),
    loadWindow(),
    loadShaders([
      "./sim/sim.vert",
      "./sim/sim.frag",
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
    const r = await fetch(p)
    const t = await r.text()
    return t
  }))
}
