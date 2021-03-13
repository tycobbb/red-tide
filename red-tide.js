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
let mTextures = null
let mShaderDescs = null

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
  draw()
  requestAnimationFrame(loop)
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
    [0.0, 0.0, -5.0]  // translate back 6 units
  )

  // conf how to pull pos vecs out of the pos buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, mBuffers.pos)
  gl.vertexAttribPointer(
    sd.attribs.pos,    // location
    2,                 // n components per vec
    gl.FLOAT,          // data type of component
    false,             // normalize?
    0,                 // stride, n bytes per item; 0 = use n components * type size (2 * 4)
    0,                 // offset, start pos in bytes
  )

  gl.enableVertexAttribArray(sd.attribs.pos)

  // conf how to pull tex pos vecs out of the tex pos buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, mBuffers.texPos)
  gl.vertexAttribPointer(
    sd.attribs.texPos, // location
    2,                 // n components per vec
    gl.FLOAT,          // data type of component
    false,             // normalize?
    0,                 // stride, n bytes per item; 0 = use n components * type size (2 * 4)
    0,                 // offset, start pos in bytes
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

  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, mTextures.red)
  gl.uniform1i(sd.uniforms.sampler, 0)

  // draw everything using vertex indices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mBuffers.indices)
  gl.drawElements(
    gl.TRIANGLES,
    6,                 // n vertices
    gl.UNSIGNED_SHORT, // type (of index)
    0,                 // offset
  )
}

// -- c/buffers
function initBuffers() {
  const gl = mGl

  // create position buffer
  const pos = gl.createBuffer()
  const posd = [
    -0.5, 0.5,
    -0.5, -0.5,
    0.5, -0.5,
    0.5, 0.5,
  ]

  gl.bindBuffer(gl.ARRAY_BUFFER, pos)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(posd), gl.STATIC_DRAW)

  // create texture buffer
  const texPos = gl.createBuffer()
  const texPosd = [
    0.0, 0.0,
    1.0, 0.0,
    1.0, 1.0,
    0.0, 1.0,
  ]

  gl.bindBuffer(gl.ARRAY_BUFFER, texPos)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texPosd), gl.STATIC_DRAW)

  // create index buffer
  const indices = gl.createBuffer();
  const indicesd = [
    0, 1, 2,
    0, 2, 3,
  ]

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indicesd), gl.STATIC_DRAW)

  // export
  return {
    pos,
    texPos,
    indices,
  }
}

// -- c/textures
function initTextures(srcs) {
  return {
    red: initTexture(srcs.red),
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
          color: gl.getAttribLocation(program, "aTexPos"),
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
        red: "./textures/red.png",
      },
      shaders: {
        draw: {
          vert: "./draw/draw.vert",
          frag: "./draw/draw.frag",
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
