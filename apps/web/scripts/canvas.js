/**
 * @file apps/web/scripts/canvas.js
 * @description WebGL GPU-accelerated mesh drift canvas for ambient privacy background.
 */

(function initMeshCanvas() {
  const canvas = document.getElementById("meshCanvas");
  if (!canvas) return;

  const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
  if (!gl) return;

  const vsSource = `
    attribute vec2 a_pos;
    void main() {
      gl_Position = vec4(a_pos, 0.0, 1.0);
    }
  `;

  const fsSource = `
    precision mediump float;
    uniform vec2 u_res;
    uniform float u_time;
    uniform float u_is_dark;

    void main() {
      vec2 st = gl_FragCoord.xy / u_res;
      
      float t = u_time * 0.0003;
      float wave1 = sin(st.x * 3.0 + t) * cos(st.y * 2.5 + t);
      float wave2 = sin(st.y * 4.0 - t * 0.8) * cos(st.x * 3.5 + t * 0.7);
      float blend = clamp((wave1 + wave2) * 0.5 + 0.5, 0.0, 1.0);

      vec3 darkCol1 = vec3(0.0, 0.0, 0.0);
      vec3 darkCol2 = vec3(0.04, 0.07, 0.16);
      vec3 lightCol1 = vec3(0.96, 0.96, 0.97);
      vec3 lightCol2 = vec3(0.88, 0.92, 0.98);

      vec3 base = mix(lightCol1, darkCol1, u_is_dark);
      vec3 drift = mix(lightCol2, darkCol2, u_is_dark);

      vec3 color = mix(base, drift, blend * 0.4);
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  function createShader(gl, type, source) {
    const s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    return s;
  }

  const program = gl.createProgram();
  gl.attachShader(program, createShader(gl, gl.VERTEX_SHADER, vsSource));
  gl.attachShader(program, createShader(gl, gl.FRAGMENT_SHADER, fsSource));
  gl.linkProgram(program);
  gl.useProgram(program);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,  1, -1, -1,  1,
    -1,  1,  1, -1,  1,  1
  ]), gl.STATIC_DRAW);

  const posLoc = gl.getAttribLocation(program, "a_pos");
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  const resLoc = gl.getUniformLocation(program, "u_res");
  const timeLoc = gl.getUniformLocation(program, "u_time");
  const darkLoc = gl.getUniformLocation(program, "u_is_dark");

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  window.addEventListener("resize", resize);
  resize();

  function render(time) {
    gl.uniform2f(resLoc, canvas.width, canvas.height);
    gl.uniform1f(timeLoc, time);
    const isDark = document.documentElement.getAttribute("data-theme") !== "light";
    gl.uniform1f(darkLoc, isDark ? 1.0 : 0.0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
})();
