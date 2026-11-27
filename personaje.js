function prepararPersonaje(dibujo, configuracion, movimientoReducido) {
  const cuadros = new Map();
  const original = dibujo.getAttribute('src');
  let direccion = 1;
  let visible = true;
  let solicitud;
  let estadoAnterior;
  let fase = 0;
  let anterior;
  let aterrizaje = -Infinity;
  let datos = { vx: 0, vy: 0, apoyado: true, paso: 250 };

  for (const [estado, { archivos, fps }] of Object.entries(configuracion.cuadros)) {
    if (!archivos.length || !(fps > 0)) continue;
    const imagenes = archivos.map(ruta => {
      const imagen = new Image();
      imagen.src = ruta;
      return imagen;
    });
    const conjunto = { archivos, fps, imagenes };
    Promise.all(imagenes.map(imagen => imagen.decode()))
      .then(() => cuadros.set(estado, conjunto)).catch(() => {});
  }

  function actualizar(vx, vy, apoyado, paso) {
    if (apoyado && !datos.apoyado) aterrizaje = performance.now();
    if (Math.abs(vx) > 1) direccion = Math.sign(vx);
    datos = { vx, vy, apoyado, paso };
    if (movimientoReducido.matches) pintar(performance.now());
  }

  function pintar(tiempo) {
    const { vx, vy, apoyado, paso } = datos;
    const rapidez = Math.min(1, Math.abs(vx) / paso);
    const desdeAterrizaje = tiempo - aterrizaje;
    const estado = !apoyado ? (vy < 0 ? 'saltando' : 'cayendo')
      : desdeAterrizaje < 120 ? 'aterrizando' : rapidez > 0.015 ? 'caminando' : 'quieto';
    dibujo.dataset.estado = estado;
    const delta = estado === estadoAnterior ? Math.min((tiempo - (anterior ?? tiempo)) / 1000, 0.05) : 0;
    if (estado !== estadoAnterior) fase = 0;
    estadoAnterior = estado;
    anterior = tiempo;

    let ruta = original;
    let y = 0, inclinacion = 0, sx = 1, sy = 1;
    if (!movimientoReducido.matches) {
      const sprites = cuadros.get(estado);
      fase += delta * (estado === 'caminando' ? rapidez : 1);
      if (sprites) {
        const cuadro = Math.floor(fase * sprites.fps);
        const indice = estado === 'caminando' || estado === 'quieto'
          ? cuadro % sprites.archivos.length : Math.min(cuadro, sprites.archivos.length - 1);
        ruta = sprites.archivos[indice];
      } else if (estado === 'caminando') {
        y = -3.4 * rapidez * (0.5 - 0.5 * Math.cos(fase * Math.PI * 4.8));
        inclinacion = 3.4 * rapidez * direccion;
      } else if (estado === 'saltando') {
        sy = 1 + 0.045 * Math.min(1, -vy / 450);
      } else if (estado === 'aterrizando') {
        const impacto = Math.sin(Math.PI * Math.max(0, desdeAterrizaje) / 120);
        sy -= 0.10 * impacto;
        sx += 0.065 * impacto;
      } else if (estado === 'quieto') {
        sy = 1 + 0.015 * (0.5 - 0.5 * Math.cos(fase * Math.PI * 0.64));
      }
    }
    if (dibujo.getAttribute('src') !== ruta) dibujo.src = ruta;
    dibujo.style.transform = `translateY(${y}px) rotate(${inclinacion}deg) scale(${direccion * sx}, ${sy})`;
  }

  function programar() {
    if (visible && !document.hidden && !movimientoReducido.matches && solicitud === undefined) {
      solicitud = requestAnimationFrame(tiempo => {
        solicitud = undefined;
        pintar(tiempo);
        programar();
      });
    }
  }

  function pausar(pausa) {
    visible = !pausa;
    sincronizar();
  }

  function sincronizar() {
    if (!visible || document.hidden || movimientoReducido.matches) {
      cancelAnimationFrame(solicitud);
      solicitud = undefined;
      anterior = undefined;
    }
    if (visible && !document.hidden) {
      pintar(performance.now());
      programar();
    }
  }

  function orientar(nuevaDireccion) {
    direccion = nuevaDireccion;
    datos = { vx: 0, vy: 0, apoyado: true, paso: datos.paso };
    aterrizaje = -Infinity;
    pintar(performance.now());
  }

  movimientoReducido.addEventListener('change', sincronizar);
  document.addEventListener('visibilitychange', sincronizar);
  sincronizar();
  return { actualizar, orientar, pausar };
}
