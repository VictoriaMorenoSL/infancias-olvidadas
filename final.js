function prepararFinal(datos, fuentes, recorrido, movimientoReducido, audio, botonSonido) {
  function elemento(etiqueta, clase, texto) {
    const nodo = document.createElement(etiqueta);
    if (clase) nodo.className = clase;
    if (texto) nodo.textContent = texto;
    return nodo;
  }

  function enlace({ nombre, url }, clase, externo = false) {
    const nodo = elemento('a', clase, nombre);
    nodo.href = url;
    if (externo) {
      nodo.target = '_blank';
      nodo.rel = 'noopener';
    }
    return nodo;
  }

  function imagen(ruta, clase, alt = '') {
    const nodo = elemento('img', clase);
    nodo.src = ruta;
    nodo.alt = alt;
    return nodo;
  }

  const epilogo = elemento('section', 'epilogo');
  epilogo.hidden = true;
  const panelCreditos = elemento('section', 'creditos-finales');
  panelCreditos.id = 'creditos-finales';
  panelCreditos.setAttribute('aria-label', datos.tituloCreditos);
  panelCreditos.hidden = true;
  const creditos = datos.creditos.map(credito => {
    const bloque = elemento('div', 'credito-final');
    if (credito.imagen) bloque.append(imagen(credito.imagen, '', credito.alt));
    if (credito.etiqueta) bloque.append(elemento('h2', '', credito.etiqueta));
    credito.lineas?.forEach(linea => bloque.append(elemento('p', '', linea)));
    return bloque;
  });
  const saltar = elemento('button', 'creditos-saltar', datos.saltarCreditos);
  saltar.type = 'button';
  panelCreditos.append(...creditos, saltar);

  const cierre = elemento('footer', 'epilogo-cierre');
  const arte = elemento('figure', 'epilogo-arte');
  if (datos.imagen.archivo) {
    arte.append(imagen(datos.imagen.archivo, 'epilogo-ilustracion', datos.imagen.alt));
  } else {
    arte.setAttribute('role', 'img');
    arte.setAttribute('aria-label', datos.imagen.alt);
    arte.append(imagen(datos.imagen.nino, 'epilogo-nino'), imagen(datos.imagen.nina, 'epilogo-nina'),
      imagen(datos.hilo, 'epilogo-hilo-manos'));
  }
  const verCreditos = elemento('button', 'final-boton final-secundario epilogo-ver-creditos', datos.verCreditos);
  verCreditos.type = 'button';
  cierre.append(arte, verCreditos);

  const fuentesVisibles = fuentes.filter(fuente => fuente.nombre);
  if (fuentesVisibles.length || datos.historia?.nombre || datos.proceso?.url) {
    const detalles = elemento('details', 'epilogo-detalles');
    detalles.append(elemento('summary', 'final-boton final-secundario', datos.tituloFuentes));
    const panelFuentes = elemento('div', 'epilogo-fuentes');
    if (datos.historia?.nombre) {
      const { etiqueta, nombre, url, detalle } = datos.historia;
      const item = elemento('p');
      item.append(url ? enlace({ nombre, url }, '', true) : nombre);
      if (detalle) item.append(` (${detalle})`);
      panelFuentes.append(elemento('h2', '', etiqueta), item);
    }
    if (fuentesVisibles.length) {
      const grupos = new Map();
      for (const fuente of fuentesVisibles) {
        const grupo = fuente.grupo || datos.tituloDatos;
        if (!grupos.has(grupo)) grupos.set(grupo, []);
        grupos.get(grupo).push(fuente);
      }
      for (const [grupo, referencias] of grupos) {
        const lista = elemento('ul');
        for (const { nombre, anio, url } of referencias) {
          const etiqueta = anio ? `${nombre} (${anio})` : nombre;
          const item = elemento('li');
          item.append(url ? enlace({ nombre: etiqueta, url }, '', true) : etiqueta);
          lista.append(item);
        }
        panelFuentes.append(elemento('h2', '', grupo), lista);
      }
    }
    if (datos.proceso?.url) {
      const proceso = enlace(datos.proceso, 'epilogo-proceso', true);
      proceso.setAttribute('aria-label', datos.proceso.etiqueta);
      panelFuentes.append(proceso);
    }
    detalles.append(panelFuentes);
    cierre.append(detalles);
  }

  const reiniciar = enlace(datos.volver, 'final-boton');
  reiniciar.addEventListener('click', audio.detener);
  cierre.append(reiniciar);
  epilogo.append(cierre);
  recorrido.append(epilogo);

  const solidos = datos.minimo / datos.porPunto;
  const difusos = (datos.maximo - datos.minimo) / datos.porPunto;
  const formato = new Intl.NumberFormat('es-MX');
  const cifras = { minimo: datos.minimo, maximo: datos.maximo, porPunto: datos.porPunto, solidos, difusos };
  const formatear = texto => texto.replace(/\{(\w+)\}/g, (_, clave) => formato.format(cifras[clave]));

  const escena = elemento('dialog', 'final-zoom');
  escena.setAttribute('aria-labelledby', 'final-texto');
  const marco = elemento('div', 'final-campo');
  const canvas = elemento('canvas', 'final-puntos');
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', formatear(datos.descripcion));
  const doble = elemento('img', 'final-doble');
  doble.alt = '';
  marco.append(canvas);
  const panel = elemento('div', 'final-panel');
  const texto = elemento('div', 'final-texto');
  texto.id = 'final-texto';
  texto.setAttribute('aria-live', 'polite');
  const leyenda = elemento('ul', 'final-leyenda');
  datos.leyenda.forEach(linea => leyenda.append(elemento('li', '', formatear(linea))));
  const continuar = elemento('button', 'final-boton', datos.continuar);
  continuar.type = 'button';
  const acciones = elemento('div', 'final-acciones');
  acciones.append(continuar);
  panel.append(texto, leyenda, acciones);
  escena.append(marco, panel, doble, panelCreditos);
  document.body.append(escena);

  const campo = prepararPuntos(canvas, solidos, difusos, datos.textura, movimientoReducido);
  const totalPasos = datos.textos.length + datos.pantallas.length;
  let paso = 0;
  let listo = false;
  let ultimaActivacion = -Infinity;
  let iniciado = false;
  let alTerminar;
  let preparandoCreditos;
  let mostrandoCreditos = false;
  let repitiendoCreditos = false;
  let desplazamientoCierre;
  let indiceCredito = 0;
  let temporizadorCreditos;
  let medirPersonaje;
  let transicion;

  function mostrarTexto() {
    const pantalla = datos.pantallas[paso - datos.textos.length];
    escena.classList.toggle('final-reflexion', Boolean(pantalla));
    leyenda.hidden = Boolean(pantalla);
    texto.replaceChildren();
    acciones.querySelector('.final-secundario')?.remove();
    if (pantalla) {
      const composicion = elemento('div', pantalla.logo ? 'reflexion-reinserta' : 'reflexion');
      const mensaje = elemento('div', 'reflexion-texto');
      pantalla.parrafos.forEach(parrafo => mensaje.append(elemento('p', '', parrafo)));
      if (pantalla.logo) {
        const marca = enlace({ nombre: pantalla.marca, url: pantalla.enlace.url }, 'reflexion-logo', true);
        marca.setAttribute('aria-label', pantalla.etiquetaLogo);
        marca.replaceChildren(imagen(pantalla.logo, '', ''));
        composicion.append(marca);
      }
      if (pantalla.enlace) acciones.prepend(enlace(pantalla.enlace, 'final-boton final-secundario', true));
      composicion.append(mensaje);
      texto.append(composicion);
    } else {
      const mensaje = elemento('p', paso > 0 ? 'final-mensaje-largo' : '');
      const [inicio, minimo, enlaceCifras, maximo, resto] = datos.textos[paso].split(/(\{minimo\})(.+?)(\{maximo\})/);
      mensaje.append(formatear(inicio));
      if (minimo) {
        const rango = elemento('span', 'final-rango');
        rango.append(elemento('strong', 'final-cifra', formatear(minimo)), enlaceCifras,
          elemento('strong', 'final-cifra', formatear(maximo)));
        mensaje.append(rango, formatear(resto));
      }
      texto.append(mensaje);
    }
    if (!movimientoReducido.matches) {
      texto.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260 });
    }
  }

  function animarPersonaje(regresar) {
    const original = medirPersonaje();
    const destino = canvas.getBoundingClientRect();
    Object.assign(doble.style, {
      left: `${original.left}px`, top: `${original.top}px`,
      width: `${original.width}px`, height: `${original.height}px`,
    });
    const dx = destino.left + destino.width / 2 - original.left - original.width / 2;
    const dy = destino.top + destino.height / 2 - original.top - original.height / 2;
    const punto = { transform: `translate(${dx}px, ${dy}px) scale(${4 / original.height})`, opacity: 0.15 };
    const nino = { transform: 'translate(0, 0) scale(1)', opacity: 1 };
    doble.hidden = false;
    return doble.animate(regresar ? [punto, nino] : [nino, punto], {
      duration: regresar ? 750 : 2000, easing: 'cubic-bezier(.35, 0, .25, 1)', fill: 'forwards',
    });
  }

  function esperarAnimacion(animacion) {
    return new Promise(resolve => {
      const limite = setTimeout(resolve, animacion.effect.getTiming().duration + 64);
      animacion.finished.catch(() => {}).then(() => {
        clearTimeout(limite);
        resolve();
      });
    });
  }

  async function iniciar({ origen, sprite, preparar, terminar }) {
    if (iniciado) return;
    iniciado = true;
    alTerminar = terminar;
    preparandoCreditos = preparar;
    medirPersonaje = origen;
    doble.src = sprite;
    doble.hidden = true;
    panel.inert = true;
    panel.classList.add('final-oculto');
    continuar.disabled = true;
    texto.textContent = formatear(datos.textos[0]);
    escena.append(botonSonido);
    escena.showModal();
    let zoom;
    if (!movimientoReducido.matches) {
      transicion = animarPersonaje(false);
      zoom = esperarAnimacion(transicion);
    }
    await new Promise(resolve => setTimeout(resolve, 3000));
    campo.iniciar();
    audio.iniciar();
    if (!movimientoReducido.matches) {
      marco.animate([{ opacity: 0.06 }, { opacity: 1 }], { duration: 500, easing: 'ease-out' });
    }
    await zoom;
    doble.hidden = true;
    campo.resaltar(true);
    transicion?.cancel();
    panel.classList.remove('final-oculto');
    panel.inert = false;
    mostrarTexto();
    continuar.disabled = false;
    ultimaActivacion = performance.now();
    listo = true;
    continuar.focus({ preventScroll: true });
  }

  async function avanzar() {
    if (!listo || performance.now() - ultimaActivacion < 320) return;
    ultimaActivacion = performance.now();
    if (paso + 1 < totalPasos) {
      paso += 1;
      mostrarTexto();
      return;
    }

    listo = false;
    continuar.disabled = true;
    panel.inert = true;
    campo.resaltar(false);
    if (!movimientoReducido.matches) {
      const salir = marco.animate([{ opacity: getComputedStyle(marco).opacity }, { opacity: 0 }], { duration: 650, fill: 'forwards' });
      panel.classList.add('final-oculto');
      await esperarAnimacion(salir);
      salir.cancel();
    }
    campo.detener();
    marco.hidden = true;
    panel.hidden = true;
    doble.hidden = true;
    escena.classList.remove('final-reflexion');
    escena.classList.add('final-creditos');
    escena.removeAttribute('aria-labelledby');
    escena.setAttribute('aria-label', datos.tituloCreditos);
    preparandoCreditos();
    iniciarCreditos();
  }

  function iniciarCreditos() {
    panelCreditos.hidden = false;
    mostrandoCreditos = true;
    mostrarCreditos();
    saltar.focus({ preventScroll: true });
  }

  function mostrarCreditos(indice = 0) {
    clearTimeout(temporizadorCreditos);
    indiceCredito = indice;
    const apilados = movimientoReducido.matches;
    saltar.textContent = apilados ? datos.continuar : datos.saltarCreditos;
    creditos.forEach((credito, i) => { credito.hidden = !apilados && indice !== i; });
    if (!apilados) {
      temporizadorCreditos = setTimeout(() => {
        if (indice + 1 === creditos.length) terminarCreditos();
        else mostrarCreditos(indice + 1);
      }, 4200);
    }
  }

  function terminarCreditos() {
    if (!mostrandoCreditos) return;
    mostrandoCreditos = false;
    clearTimeout(temporizadorCreditos);
    audio.salir();
    botonSonido.hidden = true;
    epilogo.hidden = false;
    epilogo.classList.add('epilogo-aparece');
    escena.close();
    panelCreditos.hidden = true;
    if (repitiendoCreditos) {
      repitiendoCreditos = false;
      window.scrollTo({ top: desplazamientoCierre, behavior: 'instant' });
      verCreditos.focus({ preventScroll: true });
    } else alTerminar();
  }

  verCreditos.addEventListener('click', () => {
    desplazamientoCierre = window.scrollY;
    repitiendoCreditos = true;
    epilogo.classList.remove('epilogo-aparece');
    botonSonido.hidden = false;
    escena.showModal();
    audio.iniciar(2);
    iniciarCreditos();
  });
  saltar.addEventListener('click', terminarCreditos);
  continuar.addEventListener('click', avanzar);
  escena.addEventListener('cancel', evento => evento.preventDefault());
  escena.addEventListener('keydown', evento => {
    if (mostrandoCreditos || !['Enter', 'NumpadEnter', 'Space'].includes(evento.code)) return;
    if (evento.target.closest('a, .sonido-nudo')) return;
    evento.preventDefault();
    evento.stopPropagation();
    if (!evento.repeat) avanzar();
  });
  escena.addEventListener('keyup', evento => {
    if (!mostrandoCreditos && evento.code === 'Space' && !evento.target.closest('.sonido-nudo')) evento.preventDefault();
  });
  movimientoReducido.addEventListener('change', () => {
    if (movimientoReducido.matches) transicion?.cancel();
    if (mostrandoCreditos) mostrarCreditos(indiceCredito);
  });

  return { iniciar, epilogo };
}

function prepararPuntos(canvas, solidos, difusos, textura, movimientoReducido) {
  const contexto = canvas.getContext('2d');
  const fondo = document.createElement('canvas');
  const base = fondo.getContext('2d');
  const grano = new Image();
  grano.src = textura;
  const total = solidos + difusos;
  const puntos = Array.from({ length: total }, () => ({
    x: Math.random(), y: Math.random(), fase: Math.random() * 2 * Math.PI,
    velocidad: 0.00034 + Math.random() * 0.0006,
    tam: 0.57 + Math.random() * 0.33,
  }));
  const orden = puntos.map((_, indice) => indice);
  for (let i = orden.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [orden[i], orden[j]] = [orden[j], orden[i]];
  }
  puntos.forEach((punto, i) => { punto.solido = orden[i] < solidos; });
  const sellos = ['#292622', '#79716b', '#9a250c'].map((color, i) => {
    const sello = document.createElement('canvas');
    sello.width = sello.height = 36;
    const tinta = sello.getContext('2d');
    return { sello, tinta, color, suave: i === 1 };
  });

  function prepararSellos() {
    for (const { tinta, color, suave } of sellos) {
      tinta.clearRect(0, 0, 36, 36);
      const centro = tinta.createRadialGradient(18, 18, 1, 18, 18, 17);
      centro.addColorStop(0, color);
      centro.addColorStop(suave ? 0.25 : 0.61, color);
      centro.addColorStop(1, 'transparent');
      tinta.fillStyle = centro;
      tinta.fillRect(0, 0, 36, 36);
      if (grano.naturalWidth) {
        tinta.globalCompositeOperation = 'source-atop';
        tinta.globalAlpha = 0.65;
        tinta.drawImage(grano, 125, 45, 31, 31, 0, 0, 36, 36);
        tinta.globalAlpha = 1;
        tinta.globalCompositeOperation = 'source-over';
      }
    }
  }

  let activo = false;
  let destacado = false;
  let raf;
  let anterior = -Infinity;
  let ancho = 0;
  let alto = 0;
  let paso = 0;
  let centro;

  function estampar(destino, tipo, punto, escala = 1) {
    const medida = paso * punto.tam * escala;
    destino.drawImage(sellos[tipo].sello, punto.cx - medida / 2, punto.cy - medida / 2, medida, medida);
  }

  function pintar(tiempo) {
    contexto.globalAlpha = 1;
    contexto.clearRect(0, 0, ancho, alto);
    contexto.drawImage(fondo, 0, 0, ancho, alto);
    for (const punto of puntos) {
      if (punto.solido) continue;
      contexto.globalAlpha = movimientoReducido.matches ? 0.34 :
        0.33 + 0.13 * Math.sin(tiempo * punto.velocidad + punto.fase);
      estampar(contexto, 1, punto, 1.32);
    }
    contexto.globalAlpha = 1;
    if (destacado && centro) estampar(contexto, 2, centro, 1.72);
  }

  function ajustar() {
    if (!activo || !contexto || !base) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const densidad = window.devicePixelRatio || 1;
    ancho = rect.width;
    alto = rect.height;
    fondo.width = canvas.width = Math.round(ancho * densidad);
    fondo.height = canvas.height = Math.round(alto * densidad);
    contexto.setTransform(densidad, 0, 0, densidad, 0, 0);
    base.setTransform(densidad, 0, 0, densidad, 0, 0);

    const columnas = Math.ceil(Math.sqrt(total * ancho / alto));
    const filas = Math.ceil(total / columnas);
    const sx = ancho / columnas;
    const sy = alto / filas;
    paso = Math.min(sx, sy);
    let cerca = Infinity;
    for (let i = 0; i < puntos.length; i++) {
      const punto = puntos[i];
      punto.cx = (i % columnas + 0.08 + punto.x * 0.84) * sx;
      punto.cy = (Math.floor(i / columnas) + 0.08 + punto.y * 0.84) * sy;
      if (punto.solido) {
        const distancia = Math.hypot(punto.cx - ancho / 2, punto.cy - alto / 2);
        if (distancia < cerca) {
          cerca = distancia;
          centro = punto;
        }
      }
    }
    for (const punto of puntos) {
      if (punto.solido && punto !== centro) estampar(base, 0, punto);
    }
    if (centro) {
      centro.cx = ancho / 2;
      centro.cy = alto / 2;
    }
    pintar(performance.now());
  }

  function cuadro(tiempo) {
    if (tiempo - anterior >= 46) {
      pintar(tiempo);
      anterior = tiempo;
    }
    raf = requestAnimationFrame(cuadro);
  }

  function actualizarMovimiento() {
    cancelAnimationFrame(raf);
    if (!activo || !contexto) return;
    if (!document.hidden && !movimientoReducido.matches) raf = requestAnimationFrame(cuadro);
    else pintar(performance.now());
  }

  const observador = new ResizeObserver(ajustar);
  grano.addEventListener('load', () => {
    prepararSellos();
    ajustar();
  });
  movimientoReducido.addEventListener('change', actualizarMovimiento);
  document.addEventListener('visibilitychange', actualizarMovimiento);

  return {
    iniciar() {
      activo = true;
      prepararSellos();
      observador.observe(canvas);
      ajustar();
      actualizarMovimiento();
    },
    resaltar(valor) {
      destacado = valor;
      if (activo && contexto) pintar(performance.now());
    },
    detener() {
      activo = false;
      cancelAnimationFrame(raf);
      observador.disconnect();
      canvas.width = fondo.width = 1;
      canvas.height = fondo.height = 1;
    },
  };
}
