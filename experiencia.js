const recorrido = document.querySelector('#recorrido');
const personaje = recorrido.querySelector('.nino-recorrido');
const dibujoPersonaje = personaje.querySelector('.dibujo-personaje');
const controles = document.querySelector('.controles-juego');
const aviso = controles.querySelector('.aviso-juego');
const avisoNudo = controles.querySelector('#aviso-nudo');
const ventana = document.querySelector('#ventana-nudo');
const movimientoReducido = matchMedia('(prefers-reduced-motion: reduce)');
let entradaTactil = matchMedia('(pointer: coarse)').matches;
const documento = document.documentElement;
const entradas = new Map();
const archivosAnclados = new Map();
let numeroIntento = 0;
const teclas = {
  ArrowLeft: 'izquierda', ArrowRight: 'derecha', ArrowUp: 'salto', Space: 'salto',
};

// Coordenadas de referencia de los fotogramas originales, en píxeles del GIF.
const encuadres = {
  'deshacer-nudo': {
    ancho: 640,
    alto: 360,
    alturaPersonaje: 230,
    nudo: { x: 430, y: 69 },
    marca: { x: 0.47, y: 0.033 },
    entrada: { x: 144, y: 334 },
    salida: { x: 118, y: 334 },
    unionEntradaX: 270,
    mano: { x: 185, y: 205 },
    // Centro del torso medido en los primeros 1.3 s del APNG, cuadro por cuadro.
    torso: { y: 194, intervalo: 100, muestrasX: [142, 143, 145, 149, 151, 152, 154, 155, 151, 149, 148, 147, 143, 133] },
  },
};

const tituloRecorrido = recorrido.querySelector('h1');
const plantillaEscena = document.querySelector('#plantilla-escena');
const posicionesIlustracion = [
  'despues', 'arriba', 'arriba', 'arriba', 'arriba', 'arriba', 'despues', 'despues',
];
const escenas = CONTENIDO.map(construirEscena);
const nudos = new Map(escenas.map(({ nudo }, indice) => {
  const siguiente = escenas[indice + 1];
  if (siguiente) nudo.continuacion.push(siguiente.articulo);
  return [nudo.id, nudo];
}));
const bloques = escenas.map(({ nudo }) => nudo.apoyo);
const zonaPersonaje = escenas[0].nudo.boton.parentElement;
recorrido.append(...escenas.map(({ articulo }) => articulo));
recorrido.append(...escenas.flatMap(({ nudo }) => Object.values(nudo.capasHilo)));
zonaPersonaje.prepend(personaje);
let presentandoFinal = false;
const punteroFino = matchMedia('(pointer: fine)');
const ayudaTeclado = document.querySelector('.ayuda-teclado');
const pulsoDolor = document.querySelector('.destello-dolor');
const entradaFinal = escenas.at(-1).nudo;
const audio = prepararAudioExperiencia(SONIDOS);
const botonSonido = document.createElement('button');
botonSonido.type = 'button';
botonSonido.className = 'final-boton sonido-nudo';
const finalRecorrido = prepararFinal(CONTENIDO.FINAL, FUENTES, recorrido, movimientoReducido, audio, botonSonido);
let sinSonido = false;
try { sinSonido = localStorage.getItem('infancias-sin-sonido') === '1'; } catch {}
let siguientePaso = 0;

function actualizarSonido() {
  audio.silenciar(sinSonido);
  botonSonido.textContent = sinSonido ? '🔇' : '🔊';
  botonSonido.setAttribute('aria-label', sinSonido ? 'Activar sonido' : 'Silenciar sonido');
}
actualizarSonido();
botonSonido.addEventListener('click', () => {
  sinSonido = !sinSonido;
  try { localStorage.setItem('infancias-sin-sonido', sinSonido ? '1' : '0'); } catch {}
  actualizarSonido();
  if (!sinSonido) iniciarSonidoRecorrido();
});
document.body.append(botonSonido);

function iniciarSonidoRecorrido(evento) {
  if (sinSonido || presentandoFinal || evento?.target === botonSonido) return;
  audio.iniciarFondo();
  actualizarEfectosEscena();
}
document.addEventListener('pointerdown', iniciarSonidoRecorrido, { passive: true });
document.addEventListener('keydown', iniciarSonidoRecorrido);

function precargarEscenas(indice) {
  escenas.slice(indice, indice + 3).forEach(({ nudo }) => audio.precargar(nudo.sonido));
}
precargarEscenas(0);
audio.precargar(SONIDOS.nudo);
SONIDOS.pasos.forEach(ruta => audio.precargar(ruta));

function reproducirNudo() {
  audio.reproducirEfecto(SONIDOS.nudo, 'nudo', 0.5, true);
}

function reproducirPaso() {
  const vigente = () => !sinSonido && !nudoEnCurso && !ventana.open && !presentandoFinal && Boolean(jugador.apoyo);
  if (!vigente()) return;
  const ruta = SONIDOS.pasos[siguientePaso];
  siguientePaso = (siguientePaso + 1) % SONIDOS.pasos.length;
  audio.paso(ruta, 0.60 + Math.random() * 0.10, 0.95 + Math.random() * 0.10, vigente);
}

const presentacionPersonaje = prepararPersonaje(dibujoPersonaje, PERSONAJE, movimientoReducido, reproducirPaso);

const progreso = document.createElement('div');
progreso.className = 'progreso-nudos';
progreso.setAttribute('role', 'progressbar');
progreso.setAttribute('aria-label', 'Nudos deshechos');
progreso.setAttribute('aria-valuemin', '0');
progreso.setAttribute('aria-valuemax', String(nudos.size));
progreso.setAttribute('aria-valuenow', '0');
document.body.append(progreso);

function actualizarProgreso() {
  const resueltos = escenas.filter(({ nudo }) => nudo.boton.dataset.estado === 'desenredado').length;
  progreso.style.setProperty('--avance', `${resueltos / nudos.size * 100}%`);
  progreso.setAttribute('aria-valuenow', String(resueltos));
}

function releerNudo(nudo) {
  if (!nudo.dato || nudo === entradaFinal || nudoEnCurso || ventana.open ||
      ventana.classList.contains('cerrando') || presentandoFinal ||
      nudo.boton.dataset.estado !== 'desenredado') return;
  soltarControles();
  controles.inert = true;
  presentacionPersonaje.pausar(true);
  abrirDato(nudo);
  actualizarNudoCercano();
}

const vinetaFinal = recorrido.querySelector('.vineta-final');
let tensado = false;
let tiempoAyuda;

function mostrarAyudaTeclado() {
  if (!punteroFino.matches || recorrido.classList.contains('en-suspenso')) return;
  clearTimeout(tiempoAyuda);
  ayudaTeclado.textContent = CONTENIDO.FINAL.ayudaTeclado;
  ayudaTeclado.hidden = false;
  tiempoAyuda = setTimeout(() => { ayudaTeclado.hidden = true; }, 4300);
}

function marcarEntradaFinal() {
  if (tensado || jugador.apoyo !== entradaFinal.apoyo) return;
  tensado = true;
  audio.marcarEscenaFinal();
  if (ultimaEscenaSonora) audio.detenerEfecto(0.6, ultimaEscenaSonora);
  ayudaTeclado.hidden = true;
  recorrido.append(personaje);
  recorrido.classList.add('en-suspenso');
  medirArea();
  escenas.slice(0, -1).forEach(({ articulo }) => { articulo.inert = true; });
}

function situarClaroFinal() {
  if (!tensado || recorrido.classList.contains('recorrido-completo')) return;
  const caja = entradaFinal.texto.getBoundingClientRect();
  const nudo = entradaFinal.boton.getBoundingClientRect();
  const plano = vinetaFinal.getBoundingClientRect();
  const centro = plano.left + plano.width / 2;
  const borde = Math.max(centro - caja.left, caja.right - centro, nudo.right - centro, area.ancho * 0.42);
  const radioX = Math.max(plano.width * 0.52, borde / 0.60);
  const fondo = Math.max(nudo.bottom, entradaFinal.apoyo.getBoundingClientRect().top);
  const radioY = Math.max(radioX * 1.06, plano.height * 0.6, (fondo - caja.top) / 0.65);
  vinetaFinal.style.setProperty('--claro-y', `${(caja.top + fondo) / 2 - plano.top}px`);
  vinetaFinal.style.setProperty('--claro-radio-x', `${radioX}px`);
  vinetaFinal.style.setProperty('--claro-radio-y', `${radioY}px`);
}

function mostrarDolor(nudo) {
  if (nudo.mostroDolor || movimientoReducido.matches) return;
  nudo.mostroDolor = true;
  pulsoDolor.hidden = false;
  const animacion = pulsoDolor.animate([
    { opacity: 0, scale: 0.85, easing: 'ease-out' },
    { opacity: 0.7, scale: 0.89, offset: 200 / 1300 },
    { opacity: 0.7, scale: 0.93, offset: 400 / 1300, easing: 'ease-out' },
    { opacity: 0, scale: 1.1 },
  ], { duration: 1300 });

  const { espejo, ancho, alturaPersonaje, torso } = nudo.encuadre;
  let siguiente;
  function actualizarHalo() {
    const { escala, izquierda, arriba } = nudo.posicion;
    const marco = recorrido.getBoundingClientRect();
    const cuadro = Math.min(torso.muestrasX.length - 1, (animacion.currentTime || 0) / torso.intervalo);
    const indice = Math.floor(cuadro);
    const inicio = torso.muestrasX[indice];
    const fin = torso.muestrasX[indice + 1] ?? inicio;
    const x = inicio + (fin - inicio) * (cuadro - indice);
    Object.assign(pulsoDolor.style, {
      left: `${marco.left + izquierda + (espejo ? ancho - x : x) * escala}px`,
      top: `${marco.top + arriba + torso.y * escala}px`,
      width: `${3.5 * alturaPersonaje * escala}px`,
    });
    if (animacion.playState === 'running') siguiente = requestAnimationFrame(actualizarHalo);
  }
  actualizarHalo();
  animacion.finished.catch(() => {}).then(() => {
    cancelAnimationFrame(siguiente);
    pulsoDolor.hidden = true;
  });
}

function construirEscena(escena, indice) {
  const articulo = plantillaEscena.content.firstElementChild.cloneNode(true);
  articulo.id = escena.id;
  // El guion indica el lado del nudo. La cuadrícula se orienta por el lado del relato.
  articulo.dataset.lado = escena.lado === 'derecha' ? 'izquierda' : 'derecha';
  articulo.hidden = indice !== 0;
  if (indice !== 0) articulo.dataset.lectura = 'hilo';
  const encabezado = articulo.querySelector('h2');
  encabezado.id = `titulo-${escena.id}`;
  encabezado.textContent = escena.titulo;
  articulo.setAttribute('aria-labelledby', encabezado.id);

  const inicio = articulo.querySelector('.escena-inicio');
  const relato = articulo.querySelector('.escena-relato');
  const parrafo = relato.querySelector('[data-plataforma]');
  parrafo.id = `relato-${escena.id}`;
  // El relato es HTML editorial del script local, con <strong> para énfasis.
  const texto = document.createElement('span');
  texto.className = 'texto-relato';
  const { wght, SEIS } = escena.estiloRelato;
  texto.style.setProperty('--relato-peso', wght);
  texto.style.setProperty('--relato-seis', SEIS);
  texto.innerHTML = escena.relato;
  parrafo.append(texto);

  // En el cierre, el relato precede al nudo. El apoyo sigue debajo de la pose animada.
  let apoyo = parrafo;
  if (escena.nudoGrande) {
    articulo.dataset.nudoFinal = '';
    inicio.before(relato);
    parrafo.removeAttribute('data-plataforma');
    apoyo = document.createElement('div');
    apoyo.className = 'relato apoyo-final';
    apoyo.dataset.plataforma = '';
    apoyo.setAttribute('aria-hidden', 'true');
    inicio.after(apoyo);
  }

  const figura = articulo.querySelector('.ilustracion');
  const { ilustracion } = escena;
  if (ilustracion.fija && ilustracion.posicion !== 'nudo') {
    const posicion = posicionesIlustracion[indice] ?? ilustracion.posicion;
    figura.dataset.posicion = posicion;
    const imagen = figura.querySelector('.fija');
    imagen.src = ilustracion.fija;
    imagen.alt = ilustracion.alt;
    if (ilustracion.animacion) figura.dataset.animacionNarrativa = ilustracion.animacion;
    if (posicion === 'arriba') {
      inicio.append(figura);
    } else if (posicion === 'opuesta') {
      relato.append(figura);
    }
  } else {
    figura.remove();
  }

  const datosNudo = escena.nudo;
  const boton = articulo.querySelector('.nudo');
  boton.id = datosNudo.id;
  boton.dataset.estado = 'enredado';
  boton.classList.toggle('nudo-grande', Boolean(escena.nudoGrande));
  boton.inert = indice !== 0;
  if (escena.nudoGrande) {
    boton.removeAttribute('aria-haspopup');
    boton.removeAttribute('aria-controls');
  }
  boton.setAttribute('aria-label', datosNudo.etiqueta || `Deshacer: ${datosNudo.titulo}`);
  boton.querySelector('.nudo-fijo').src = datosNudo.imagen;
  const { hilo } = escena;
  const revelado = hilo.salida.desvio ? crearDesvioHilo(hilo.salida, datosNudo.id)
    : crearReveladoHilo(hilo.salida, datosNudo.id);
  const capasHilo = {
    entrada: crearCapaHilo(hilo.entrada.archivo, 'tramo-hilo hilo-entrada'),
    salida: revelado?.capa || crearCapaHilo(hilo.salida.archivo, 'tramo-hilo hilo-salida'),
    enredado: crearCapaHilo(hilo.enredado, 'hilo-nudo hilo-enredado'),
    poseMano: crearCapaHilo(hilo.poseMano, 'pose-mano'),
  };
  const { id, espejo } = datosNudo.encuadre;

  return {
    articulo,
    figura: figura.parentNode ? figura : null,
    nudo: {
      ...datosNudo,
      articulo,
      grande: Boolean(escena.nudoGrande),
      sonido: escena.sonido,
      encuadre: { ...encuadres[id], espejo },
      boton,
      texto,
      indicacion: boton.querySelector('.indicacion-nudo'),
      apoyo,
      hilo,
      revelado,
      ilustracion: escena.ilustracion,
      capasHilo,
      continuacion: [],
    },
  };
}

function crearCapaHilo(archivo, clases) {
  const imagen = document.createElement('img');
  imagen.alt = '';
  imagen.className = clases;
  imagen.hidden = true;
  imagen.src = archivo;
  return imagen;
}

function parrafoTarjeta(contenedor, texto, clase) {
  if (texto == null || texto === '') return;
  const parrafo = document.createElement('p');
  if (clase) parrafo.className = clase;
  parrafo.textContent = texto;
  contenedor.append(parrafo);
}

function crearVisualDato(tipo, datos, descripcion) {
  if (!datos || !['linea-edad', 'pictograma', 'barras'].includes(tipo)) return null;
  const visual = document.createElement('div');
  visual.className = `visual-dato visual-${tipo}`;
  visual.setAttribute('role', 'img');
  visual.setAttribute('aria-label', descripcion);

  if (tipo === 'barras') {
    const maximo = Math.max(...datos.map(({ valor }) => valor));
    const formato = new Intl.NumberFormat('es-MX');
    datos.forEach(({ anio, valor }) => {
      const fila = document.createElement('div');
      fila.className = 'barra-dato';
      const etiqueta = document.createElement('span');
      etiqueta.textContent = anio;
      const pista = document.createElement('span');
      pista.className = 'barra-pista';
      const tinta = document.createElement('span');
      tinta.style.inlineSize = `${valor / maximo * 100}%`;
      pista.append(tinta);
      const cantidad = document.createElement('span');
      cantidad.textContent = formato.format(valor);
      fila.append(etiqueta, pista, cantidad);
      visual.append(fila);
    });
    return visual;
  }

  if (tipo === 'pictograma') {
    for (let i = 0; i < datos.total; i++) {
      const figura = document.createElement('img');
      figura.src = './assets/Imgs/nin%CC%83o.PNG';
      figura.alt = '';
      figura.className = i < datos.marcados ? 'figura-dato marcada' : 'figura-dato';
      figura.setAttribute('aria-hidden', 'true');
      visual.append(figura);
    }
    return visual;
  }

  const svg = (nombre, atributos) => {
    const elemento = document.createElementNS('http://www.w3.org/2000/svg', nombre);
    for (const [clave, valor] of Object.entries(atributos)) elemento.setAttribute(clave, valor);
    return elemento;
  };
  const grafica = svg('svg', { viewBox: '0 0 300 45', 'aria-hidden': 'true' });
  const x = edad => 14 + edad * 16;
  const eje = (desde, hasta, y, grosor) => svg('line', {
    x1: x(desde), x2: x(hasta), y1: y, y2: y, stroke: 'currentColor', 'stroke-width': grosor,
  });
  grafica.append(eje(0, 17, 18, 1));
  grafica.append(eje(datos.rango[0], datos.rango[1], 18, 5));
  const edadesConEtiqueta = new Set([0, 17, ...datos.rango, datos.marca]);
  for (let edad = 0; edad <= 17; edad++) {
    grafica.append(svg('line', { x1: x(edad), x2: x(edad), y1: 13, y2: 23, stroke: 'currentColor' }));
    if (edadesConEtiqueta.has(edad)) {
      const etiqueta = svg('text', { x: x(edad), y: 39, 'text-anchor': 'middle', fill: 'currentColor' });
      etiqueta.textContent = edad;
      grafica.append(etiqueta);
    }
  }
  if (datos.marca != null) {
    grafica.append(svg('circle', { cx: x(datos.marca), cy: 6, r: 4, fill: 'currentColor' }));
  }
  visual.append(grafica);
  return visual;
}

function ilustracionTarjeta(nudo) {
  const propia = nudo.dato.ilustracion;
  return propia ? { ...propia, fija: propia.fija || propia.src } : nudo.ilustracion;
}

function abrirDato(nudo) {
  mostrarDato(nudo);
  ventana.showModal();
  ventana.querySelector('.dato').scrollTop = 0;
  if (nudo.sonido) audio.reproducirEfecto(nudo.sonido, 'tarjeta', 0.45);
  else audio.detenerEfecto(0.6);
}

function mostrarDato(nudo) {
  const { texto, contexto, visual, visualDatos, fuente, fuentes = [fuente] } = nudo.dato;
  ventana.dataset.escena = nudo.articulo.id;
  const contenido = ventana.querySelector('.dato');
  contenido.replaceChildren();
  const ilustracion = ilustracionTarjeta(nudo);
  if (ilustracion.fija) {
    const imagen = document.createElement('img');
    imagen.className = 'dato-ilustracion';
    imagen.src = movimientoReducido.matches ? ilustracion.fija : ilustracion.animacion || ilustracion.fija;
    imagen.alt = ilustracion.alt ?? '';
    imagen.dataset.fija = ilustracion.fija;
    if (ilustracion.animacion) imagen.dataset.animacion = ilustracion.animacion;
    imagen.addEventListener('error', () => { imagen.src = ilustracion.fija; }, { once: true });
    contenido.append(imagen);
  }

  const titulo = document.createElement('h2');
  titulo.id = 'titulo-ventana';
  titulo.textContent = nudo.titulo;
  contenido.append(titulo);
  parrafoTarjeta(contenido, texto, 'dato-texto');

  if (contexto?.cifra || contexto?.texto) {
    const separador = document.createElement('div');
    separador.className = 'separador-dato';
    const hilo = document.createElement('img');
    hilo.src = './assets/web/hilo-entrada-orfanato.svg';
    hilo.alt = '';
    separador.append(hilo);
    contenido.append(separador);

    const bloque = document.createElement('div');
    bloque.className = 'dato-contexto';
    parrafoTarjeta(bloque, contexto.cifra, 'cifra');
    parrafoTarjeta(bloque, contexto.texto, 'contexto-texto');
    contenido.append(bloque);
  }

  const grafica = crearVisualDato(visual, visualDatos,
    [contexto?.cifra, contexto?.texto].filter(Boolean).join(' ') || texto);
  if (grafica) contenido.append(grafica);

  for (const fuente of fuentes.filter(item => item?.nombre && item.url)) {
    const referencia = document.createElement('p');
    referencia.className = 'fuente';
    const enlace = document.createElement('a');
    enlace.href = fuente.url;
    enlace.textContent = fuente.anio ? `${fuente.nombre} (${fuente.anio})` : fuente.nombre;
    referencia.append(enlace);
    contenido.append(referencia);
  }
}

const jugador = { x: 0, pies: 0, velocidadY: 0, apoyo: bloques[0], limite: escenas[0].nudo };
let ladoTope = 0;
let area;
let fotograma;
let tiempoAnterior;
let nudoEnCurso;
let nudoConPose;
let nudoCercano;
let jugando = false;
let siguiendoCamara = false;

const limitar = (valor, minimo, maximo) => Math.max(minimo, Math.min(maximo, valor));

function medirArea() {
  if (recorrido.classList.contains('recorrido-completo')) return;
  const marco = recorrido.getBoundingClientRect();
  const origen = personaje.parentElement.getBoundingClientRect();
  const ancho = marco.width;
  const anchoPersonaje = personaje.offsetWidth;
  const altoPersonaje = personaje.offsetHeight;
  const visibles = escenas.filter(({ articulo }) => !articulo.hidden);
  const superficies = visibles.map(({ articulo, nudo }) => {
    const rect = nudo.apoyo.getBoundingClientRect();
    return {
      soporte: nudo.apoyo,
      nudo,
      techo: articulo.getBoundingClientRect().top - marco.top,
      izquierda: rect.left - marco.left,
      derecha: rect.right - marco.left,
      topeIzquierdo: rect.left - marco.left + anchoPersonaje / 2,
      topeDerecho: rect.right - marco.left - anchoPersonaje / 2,
      y: rect.top - marco.top - 4,
    };
  });
  superficies.sort((a, b) => a.y - b.y);
  const fondo = visibles.at(-1).articulo;
  const suelo = fondo.getBoundingClientRect().bottom - marco.top - 6;
  const diferencia = superficies.slice(1).reduce((maximo, piso, i) =>
    Math.max(maximo, piso.y - superficies[i].y), suelo - superficies.at(-1).y);
  const obras = visibles.flatMap(({ figura }) => {
    if (!figura) return [];
    const rect = figura.getBoundingClientRect();
    const nudo = escenas.find(escena => escena.figura === figura).nudo;
    const silueta = nudo.ilustracion.silueta;
    if (silueta) {
      const niño = PERSONAJE.silueta;
      const altoVisible = altoPersonaje * (niño.suela - niño.arriba) / niño.alto;
      const lado = 1.4 * altoVisible * silueta.alto / (silueta.suela - silueta.arriba);
      const piso = superficies.find(superficie => superficie.nudo === nudo).y;
      const pies = marco.top + piso - altoPersonaje * (niño.alto - niño.suela) / niño.alto;
      figura.style.setProperty('--guardia-lado', `${lado}px`);
      figura.style.setProperty('--guardia-arriba', `${pies - rect.top - lado * silueta.suela / silueta.alto}px`);
    }
    return [{
      figura, izquierda: rect.left - marco.left, derecha: rect.right - marco.left,
      arriba: rect.top - marco.top, abajo: rect.bottom - marco.top,
    }];
  });
  const escala = ancho / 390;
  const gravedad = 1900 * escala;

  jugador.x = limitar(
    area ? jugador.x * (ancho / area.ancho) : ancho * 0.06 + anchoPersonaje / 2,
    anchoPersonaje / 2,
    ancho - anchoPersonaje / 2,
  );
  const apoyo = superficies.find(superficie => superficie.soporte === jugador.apoyo);
  if (jugador.apoyo) jugador.pies = apoyo?.y ?? suelo;
  else if (area) jugador.pies = limitar(jugador.pies * (ancho / area.ancho), altoPersonaje, suelo);

  area = {
    ancho, anchoPersonaje, altoPersonaje, superficies, obras, suelo, gravedad,
    salto: Math.sqrt(2 * gravedad * Math.max(105 * escala, diferencia + 38 * escala)),
    paso: 250 * escala,
    origenX: origen.left - marco.left,
    origenY: origen.top - marco.top,
  };

  const limite = superficies.find(piso => piso.nudo === jugador.limite);
  if (limite) {
    jugador.x = limitar(jugador.x, limite.topeIzquierdo, limite.topeDerecho);
    jugador.pies = limitar(jugador.pies, piesMinimos(limite), limite.y);
  }

  recorrido.dataset.jugable = '';
  nudos.forEach(nudo => {
    nudo.posicion = medirNudo(nudo, marco);
    if (nudo.capaAnimada && nudo.posicion) colocarAnimacion(nudo);
  });
  dibujarPersonaje();
  actualizarHilos();
  actualizarNudoCercano();
  orientarIndicacion();
  situarClaroFinal();
}

function medirNudo(nudo, marco) {
  const { encuadre } = nudo;
  const rect = nudo.boton.getBoundingClientRect();
  const plataforma = area.superficies.find(superficie => superficie.soporte === nudo.apoyo);
  if (!plataforma || !rect.width) return null;
  const pies = plataforma.y;
  const reflejarX = x => encuadre.espejo ? encuadre.ancho - x : x;
  const marca = nudo.marcaImagen || encuadre.marca;
  const marcaX = encuadre.espejo ? 1 - marca.x : marca.x;
  const x = rect.left - marco.left + rect.width * marcaX;
  const y = rect.top - marco.top + rect.height * marca.y;
  const escalaPersonaje = area.altoPersonaje / encuadre.alturaPersonaje;
  const escalaRegistro = (pies - y) / (encuadre.entrada.y - encuadre.nudo.y);
  const escala = Math.min(area.ancho / encuadre.ancho,
    nudo.grande ? escalaRegistro : limitar(escalaRegistro, escalaPersonaje * 0.86, escalaPersonaje * 1.05));
  const ancho = encuadre.ancho * escala;
  const izquierda = limitar(x - reflejarX(encuadre.nudo.x) * escala, 0, area.ancho - ancho);
  return {
    ancho,
    izquierda,
    arriba: pies - encuadre.entrada.y * escala,
    escala,
    unionEntradaX: izquierda + reflejarX(encuadre.unionEntradaX) * escala,
    punta: nudo.grande ? {
      x, y,
    } : { x: izquierda + reflejarX(encuadre.unionEntradaX) * escala,
      y: pies - encuadre.entrada.y * escala + 2.5 },
    mano: { x: izquierda + reflejarX(encuadre.mano.x) * escala, y: pies + (encuadre.mano.y - encuadre.entrada.y) * escala },
    entrada: izquierda + reflejarX(encuadre.entrada.x) * escala,
    salida: izquierda + reflejarX(encuadre.salida.x) * escala,
    bordeNudo: (encuadre.espejo ? rect.right : rect.left) - marco.left,
  };
}

function anclarTramo(imagen, recurso, inicio, fin, escala, espejo) {
  // Matrix ubica el dibujo existente entre dos puntos; las puntas se solapan 2.5 px.
  const sx = escala * 7 / recurso.grosor * (espejo ? -1 : 1);
  const inicioY = recurso.inicioY ?? 0;
  const longitudY = recurso.alto - inicioY;
  const sy = (fin.y - inicio.y) / longitudY;
  const inclinacion = (fin.x - inicio.x - sx * (recurso.finX - recurso.inicioX)) / longitudY;
  imagen.style.width = `${recurso.ancho}px`;
  imagen.style.height = `${recurso.alto}px`;
  const x = inicio.x - sx * recurso.inicioX - inclinacion * inicioY;
  const y = inicio.y - sy * inicioY;
  imagen.style.transform = `matrix(${sx}, 0, ${inclinacion}, ${sy}, ${x}, ${y})`;
  return { sx, sy, inclinacion, x, y };
}

function actualizarHilos() {
  const titulo = tituloRecorrido.getBoundingClientRect();
  const marco = recorrido.getBoundingClientRect();
  // Este punto cae sobre la tinta del título, cerca del borde inferior del tercer A.
  const origenTitulo = {
    x: titulo.left - marco.left + titulo.width * 0.633,
    y: titulo.bottom - marco.top - 1.5,
  };
  escenas.forEach(({ nudo }, indice) => {
    if (!nudo.posicion) return;
    const { capasHilo, encuadre, posicion, hilo } = nudo;
    const { escala, mano } = posicion;
    const activo = nudo.capaAnimada && !nudo.capaAnimada.hidden;
    const resuelto = nudo.boton.dataset.estado === 'desenredado';
    const previo = escenas[indice - 1]?.nudo;
    const enlazado = previo?.boton.dataset.estado === 'desenredado';
    const siguiente = escenas[indice + 1]?.nudo;

    const primeroVisible = indice === 0 && nudoListo(nudo);
    actualizarPoseNudo(nudo, primeroVisible || enlazado && (!previo.revelado || previo.revelado.completo));
    capasHilo.entrada.hidden = indice !== 0 || (!primeroVisible && !resuelto && !activo);
    if (!capasHilo.entrada.hidden) {
      anclarTramo(capasHilo.entrada, hilo.entrada, origenTitulo,
        resuelto ? mano : posicion.punta, escala, encuadre.espejo);
    }

    capasHilo.salida.hidden = !resuelto || !siguiente?.posicion;
    if (!capasHilo.salida.hidden) {
      const fin = siguiente.boton.dataset.estado === 'desenredado' ? siguiente.posicion.mano
        : siguiente.grande && siguiente.capaAnimada && !siguiente.capaAnimada.hidden ? {
          x: siguiente.posicion.unionEntradaX, y: siguiente.posicion.arriba + 2.5,
        }
        : siguiente.posicion.punta;
      const empalme = { x: mano.x, y: mano.y - 2.5 };
      if (hilo.salida.desvio) {
        const textoArriba = nudo.texto.getBoundingClientRect().top - marco.top;
        colocarDesvioHilo(nudo.revelado, hilo.salida, empalme, fin, area.ancho, textoArriba);
      } else {
        const matriz = anclarTramo(capasHilo.salida, hilo.salida, empalme, fin, escala, encuadre.espejo);
        if (nudo.revelado) medirRevelado(nudo.revelado, matriz);
      }
    }
  });
  actualizarDesenrollado();
  actualizarTransparenciaIlustraciones();
}

function actualizarPoseNudo(nudo, enlazado) {
  const { capasHilo, encuadre, posicion } = nudo;
  const { izquierda, arriba, ancho, escala } = posicion;
  const activo = nudo.capaAnimada && !nudo.capaAnimada.hidden;
  const resuelto = nudo.boton.dataset.estado === 'desenredado';
  capasHilo.enredado.classList.toggle('entrada-nudo-lectura', nudo.articulo.dataset.lectura === 'nudo');
  capasHilo.enredado.hidden = nudo.grande || !enlazado || resuelto || activo ||
    ![undefined, 'nudo', 'lista'].includes(nudo.articulo.dataset.lectura);
  nudo.boton.toggleAttribute('data-hilo-enlazado', !capasHilo.enredado.hidden);
  capasHilo.poseMano.hidden = nudoConPose !== nudo;
  const pose = resuelto ? capasHilo.poseMano : capasHilo.enredado;
  if (!pose.hidden) {
    Object.assign(pose.style, {
      left: `${izquierda}px`, top: `${arriba}px`, width: `${ancho}px`,
      height: `${encuadre.alto * escala}px`,
      transform: encuadre.espejo ? 'translateX(100%) scaleX(-1)' : '',
    });
  }
}

function actualizarDesenrollado() {
  escenas.forEach(({ nudo }, indice) => {
    if (nudo.capasHilo.salida.hidden || !nudo.revelado || nudo.revelado.completo) return;
    const siguiente = escenas[indice + 1].nudo;
    const llego = jugador.apoyo === siguiente.apoyo;
    if (avanzarRevelado(nudo.revelado, jugador.x, jugador.pies, movimientoReducido.matches || llego)) {
      actualizarPoseNudo(siguiente, true);
      actualizarLecturas();
    }
  });
}

function colocarAnimacion(nudo) {
  const { ancho, izquierda, arriba } = nudo.posicion;
  Object.assign(nudo.capaAnimada.style, {
    width: `${ancho}px`, left: `${izquierda}px`, top: `${arriba}px`,
  });
}

function dibujarPersonaje() {
  const izquierda = jugador.x - area.anchoPersonaje / 2;
  const arriba = jugador.pies - area.altoPersonaje;
  personaje.style.transform = `translate3d(${izquierda - area.origenX}px, ${arriba - area.origenY}px, 0)`;

}

function actualizarTransparenciaIlustraciones() {
  const nudo = nudoEnCurso;
  const animando = nudo?.capaAnimada && !nudo.capaAnimada.hidden;
  if (!animando) {
    for (const { figura } of area.obras) figura.removeAttribute('data-cruce-personaje');
    return;
  }

  // Solo cuenta el espacio del niño en la animación, incluidos los encuadres espejados.
  const { entrada, salida } = nudo.posicion;
  const centro = (entrada + salida) / 2;
  const pies = nudo.posicion.arriba + nudo.encuadre.entrada.y * nudo.posicion.escala;
  const altura = nudo.encuadre.alturaPersonaje * nudo.posicion.escala;
  const mitad = area.anchoPersonaje * 0.38 + 3;
  for (const { figura, izquierda, derecha, arriba, abajo } of area.obras) {
    const margenX = (derecha - izquierda) * 0.12;
    const margenY = (abajo - arriba) * 0.10;
    const cerca = centro + mitad > izquierda + margenX && centro - mitad < derecha - margenX &&
      pies > arriba + margenY && pies - altura < abajo - margenY;
    figura.toggleAttribute('data-cruce-personaje', cerca);
  }
}

function sobrePlataforma(x, plataforma) {
  // Los pies pueden apoyarse en el borde aunque parte del cuerpo sobresalga.
  const margen = area.anchoPersonaje * 0.16;
  return x + margen >= plataforma.izquierda && x - margen <= plataforma.derecha;
}

function seguirPersonaje(delta) {
  const inicio = recorrido.getBoundingClientRect().top;
  const arriba = inicio + jugador.pies - area.altoPersonaje;
  const abajo = inicio + jugador.pies;
  const alto = window.innerHeight;
  let ajuste = 0;
  if (arriba < alto * 0.17) ajuste = arriba - alto * 0.17;
  else if (abajo > alto * 0.71) ajuste = abajo - alto * 0.71;
  if (Math.abs(ajuste) < 1) return false;
  const anterior = window.scrollY;
  const avance = movimientoReducido.matches ? ajuste : ajuste * (1 - Math.exp(-12 * delta));
  window.scrollBy({ top: Math.sign(avance) * Math.max(1, Math.abs(avance)), behavior: 'instant' });
  return window.scrollY !== anterior;
}

function programarFotograma() {
  if (fotograma === undefined) fotograma = requestAnimationFrame(avanzar);
}

function piesMinimos(plataforma) {
  return Math.min(plataforma.y, plataforma.techo + area.altoPersonaje);
}

function temblarTope(nudo) {
  if (movimientoReducido.matches) {
    nudo.avisoTope = false;
    return;
  }
  nudo.avisoTope = !nudoListo(nudo);
  if (nudo.avisoTope) return;
  const dibujo = nudo.capasHilo.enredado.hidden ? nudo.boton.querySelector('.nudo-fijo') : nudo.capasHilo.enredado;
  nudo.temblorTope?.cancel();
  nudo.temblorTope = dibujo.animate([
    { translate: '0 0' }, { translate: '-2px 0' }, { translate: '2px -1px' },
    { translate: '-1px 1px' }, { translate: '1px 0' }, { translate: '0 0' },
  ], { duration: 400, easing: 'steps(6, end)' });
}

function avanzar(tiempo) {
  fotograma = undefined;
  if (!jugando || nudoEnCurso || ventana.open || presentandoFinal || document.hidden) {
    tiempoAnterior = undefined;
    siguiendoCamara = false;
    return;
  }

  const delta = Math.min((tiempo - (tiempoAnterior ?? tiempo - 16)) / 1000, 0.034);
  tiempoAnterior = tiempo;
  const presionadas = [...entradas.values()];
  const direccion = Number(presionadas.includes('derecha')) - Number(presionadas.includes('izquierda'));
  const xAnterior = jugador.x;
  const limite = area.superficies.find(piso => piso.nudo === jugador.limite);
  const xDeseada = jugador.x + direccion * area.paso * delta;
  jugador.x = limitar(xDeseada, limite?.topeIzquierdo ?? area.anchoPersonaje / 2,
    limite?.topeDerecho ?? area.ancho - area.anchoPersonaje / 2);
  const golpe = limite && jugador.x !== xDeseada ? direccion : 0;
  if (golpe && golpe !== ladoTope) temblarTope(limite.nudo);
  ladoTope = golpe;

  if (jugador.apoyo && jugador.apoyo !== recorrido && !limite) {
    const superficie = area.superficies.find(piso => piso.soporte === jugador.apoyo);
    if (!sobrePlataforma(jugador.x, superficie)) jugador.apoyo = null;
  }

  const enAire = !jugador.apoyo;
  if (enAire) {
    const pies = jugador.pies + jugador.velocidadY * delta + 0.5 * area.gravedad * delta ** 2;
    jugador.velocidadY += area.gravedad * delta;
    // La primera plataforma pendiente detiene la caída incluso si el niño llega por uno de sus lados.
    const destino = pies >= jugador.pies && area.superficies.find(superficie =>
      jugador.pies <= superficie.y && pies >= superficie.y &&
      (superficie.nudo?.boton.dataset.estado === 'enredado' || sobrePlataforma(jugador.x, superficie)));

    if (destino || pies >= area.suelo) {
      if (destino?.nudo?.boton.dataset.estado === 'enredado') {
        jugador.limite = destino.nudo;
        jugador.x = limitar(jugador.x, destino.topeIzquierdo, destino.topeDerecho);
      }
      jugador.pies = destino ? destino.y : area.suelo;
      jugador.apoyo = destino ? destino.soporte : recorrido;
      if (ultimaEscenaSonora && destino?.nudo !== ultimaEscenaSonora.nudo) {
        audio.detenerEfecto(0.6, ultimaEscenaSonora);
      }
      jugador.velocidadY = 0;
    } else {
      const techo = limite ? piesMinimos(limite) : area.altoPersonaje;
      jugador.pies = Math.max(techo, pies);
      if (pies < techo) jugador.velocidadY = 0;
    }
  }

  marcarEntradaFinal();
  const vx = delta ? (jugador.x - xAnterior) / delta : 0;
  presentacionPersonaje.actualizar(vx, jugador.velocidadY, Boolean(jugador.apoyo), area.paso);
  const movio = xAnterior !== jugador.x || enAire;
  if (movio) {
    if (nudoConPose) {
      nudoConPose.capasHilo.poseMano.hidden = true;
      nudoConPose = null;
      personaje.classList.remove('fuera-de-escena');
    }
    aviso.textContent = '';
    dibujarPersonaje();
    actualizarDesenrollado();
    actualizarNudoCercano();
  }
  siguiendoCamara = (movio || siguiendoCamara) && seguirPersonaje(delta);
  if (presionadas.length || !jugador.apoyo || siguiendoCamara) programarFotograma();
  else tiempoAnterior = undefined;
}

function activarControl(id, accion) {
  if (!area || nudoEnCurso || ventana.open || presentandoFinal || entradas.has(id)) return;
  aviso.textContent = '';
  entradas.set(id, accion);
  jugando = true;
  if (accion === 'salto' && jugador.apoyo) {
    // Acorta el salto si el borde superior está cerca.
    const distancia = jugador.pies - area.altoPersonaje;
    jugador.velocidadY = -Math.min(area.salto, Math.sqrt(2 * area.gravedad * distancia));
    jugador.apoyo = null;
  }
  programarFotograma();
}

function soltarControles() {
  entradas.clear();
  tiempoAnterior = undefined;
  if (area) presentacionPersonaje.actualizar(0, jugador.velocidadY, Boolean(jugador.apoyo), area.paso);
}

document.addEventListener('pointerdown', evento => {
  cambiarTipoEntrada(evento.pointerType === 'touch' || evento.pointerType === 'pen');
}, { capture: true, passive: true });

document.addEventListener('keydown', evento => {
  cambiarTipoEntrada(false);
  if (evento.target !== recorrido || evento.altKey || evento.ctrlKey || evento.metaKey) return;
  if ((evento.code === 'Enter' || evento.code === 'NumpadEnter') && nudoCercano) {
    evento.preventDefault();
    if (!evento.repeat) activarNudo(nudoCercano);
    return;
  }
  const accion = teclas[evento.code];
  if (!accion) return;
  evento.preventDefault();
  if (!evento.repeat) activarControl(evento.code, accion);
});
document.addEventListener('keyup', evento => entradas.delete(evento.code));
recorrido.addEventListener('blur', () => Object.keys(teclas).forEach(tecla => entradas.delete(tecla)));
window.addEventListener('blur', soltarControles);

controles.querySelectorAll('[data-control]').forEach(boton => {
  boton.addEventListener('pointerdown', evento => {
    if (evento.button !== 0) return;
    evento.preventDefault();
    recorrido.focus({ preventScroll: true });
    boton.setPointerCapture(evento.pointerId);
    activarControl(evento.pointerId, boton.dataset.control);
  });
  for (const tipo of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    boton.addEventListener(tipo, evento => entradas.delete(evento.pointerId));
  }
  boton.addEventListener('click', evento => {
    if (evento.detail !== 0) return;
    const pulso = Symbol();
    activarControl(pulso, boton.dataset.control);
    setTimeout(() => entradas.delete(pulso), 125);
  });
});

function estaCerca(nudo) {
  if (!nudo.posicion || jugador.apoyo !== nudo.apoyo) return false;
  const { entrada, bordeNudo } = nudo.posicion;
  const margen = area.anchoPersonaje / 2;
  return jugador.x >= Math.min(entrada, bordeNudo) - margen &&
    jugador.x <= Math.max(entrada, bordeNudo) + margen;
}

function mostrarIndicacion(nudo) {
  const resuelto = nudo?.boton.dataset.estado === 'desenredado';
  const texto = resuelto
    ? (entradaTactil ? 'Toca para volver a leer' : 'Presiona Enter para volver a leer')
    : (entradaTactil ? 'Toca el nudo para deshacerlo' : 'Presiona Enter para deshacer el nudo');
  if (nudo) nudo.indicacion.textContent = texto;
  avisoNudo.textContent = nudo ? texto : '';
  orientarIndicacion();
}

function cambiarTipoEntrada(tactil) {
  if (tactil === entradaTactil) return;
  entradaTactil = tactil;
  mostrarIndicacion(nudoCercano);
}

function orientarIndicacion() {
  if (!nudoCercano) return;
  const { boton, indicacion, texto } = nudoCercano;
  const nudo = boton.getBoundingClientRect();
  const marco = recorrido.getBoundingClientRect();
  const ancho = indicacion.offsetWidth;
  const alto = indicacion.offsetHeight;
  const margen = 9;
  const centroX = nudo.left + nudo.width / 2;
  const centroY = nudo.top + nudo.height / 2;
  const x = limitar(centroX - ancho / 2, marco.left + margen, marco.right - ancho - margen);
  const base = punteroFino.matches ? progreso.getBoundingClientRect().top : controles.getBoundingClientRect().top;
  const y = limitar(centroY - alto / 2, margen, base - alto - margen);
  const posiciones = [
    ['arriba', x, nudo.top - alto - margen],
    ['abajo', x, nudo.bottom + margen],
    ['derecha', nudo.right + margen, y],
    ['izquierda', nudo.left - ancho - margen, y],
  ];
  if (nudo.left - marco.left > marco.right - nudo.right) {
    [posiciones[2], posiciones[3]] = [posiciones[3], posiciones[2]];
  }
  const obstaculos = [tituloRecorrido.getBoundingClientRect(), texto.getBoundingClientRect(),
    botonSonido.getBoundingClientRect(),
    ...area.obras.map(obra => ({
      left: marco.left + obra.izquierda, right: marco.left + obra.derecha,
      top: marco.top + obra.arriba, bottom: marco.top + obra.abajo,
    }))];
  const limiteInferior = base;
  let mejor;
  for (const [lado, izquierda, arriba] of posiciones) {
    const derecha = izquierda + ancho;
    const abajo = arriba + alto;
    const fuera = Math.max(0, marco.left - izquierda, derecha - marco.right) * alto +
      Math.max(0, -arriba, abajo - limiteInferior) * ancho;
    const colision = obstaculos.reduce((total, rect) => total +
      Math.max(0, Math.min(derecha, rect.right) - Math.max(izquierda, rect.left)) *
      Math.max(0, Math.min(abajo, rect.bottom) - Math.max(arriba, rect.top)), 0);
    const costo = fuera * 2 + colision;
    if (!mejor || costo < mejor.costo) mejor = { lado, izquierda, arriba, costo };
    if (costo === 0) break;
  }
  indicacion.dataset.lado = mejor.lado;
  indicacion.style.left = `${mejor.izquierda - nudo.left}px`;
  indicacion.style.top = `${mejor.arriba - nudo.top}px`;
  indicacion.style.setProperty('--pico-x', `${limitar(centroX - mejor.izquierda, 10, ancho - 10)}px`);
  indicacion.style.setProperty('--pico-y', `${limitar(centroY - mejor.arriba, 10, alto - 10)}px`);
}

function actualizarNudoCercano() {
  const pendiente = jugador.limite;
  if (pendiente?.avisoTope && nudoListo(pendiente)) temblarTope(pendiente);
  const disponible = !nudoEnCurso && !ventana.open && !documento.classList.contains('esperando-nudo');
  const siguiente = disponible ? [...nudos.values()].find(nudo =>
    (nudo.boton.dataset.estado === 'enredado' || (nudo.dato && nudo !== entradaFinal)) &&
    nudoListo(nudo) && estaCerca(nudo)) : undefined;
  if (nudoCercano === siguiente) return;
  nudoCercano?.boton.removeAttribute('data-disponible');
  nudoCercano?.capasHilo.enredado.removeAttribute('data-disponible');
  nudoCercano = siguiente;
  nudoCercano?.boton.setAttribute('data-disponible', '');
  nudoCercano?.capasHilo.enredado.setAttribute('data-disponible', '');
  mostrarIndicacion(siguiente);
}

async function situarEntrada(nudo) {
  const desde = personaje.style.transform;
  const distancia = Math.abs(jugador.x - nudo.posicion.entrada);
  jugador.x = nudo.posicion.entrada;
  dibujarPersonaje();
  if (distancia < 2 || typeof personaje.animate !== 'function') return;
  const traslado = personaje.animate([
    { transform: desde },
    { transform: personaje.style.transform },
  ], { duration: limitar(distancia * 6, 100, 420), easing: 'ease-in-out' });
  await traslado.finished.catch(() => {});
}

function crearAnimacion(ruta, ancho, alto) {
  const imagen = new Image(ancho, alto);
  imagen.alt = '';
  imagen.decoding = 'async';
  if (ruta) imagen.src = ruta;
  return imagen;
}

async function unaVuelta(ruta) {
  // Quita la extensión de bucle de la copia en memoria cuando se sirve por HTTP.
  // El original también se puede mostrar directamente desde file://.
  if (location.protocol === 'file:') return null;
  try {
    const respuesta = await fetch(ruta, { signal: AbortSignal.timeout(7000) });
    if (!respuesta.ok) return null;
    const gif = new Uint8Array(await respuesta.arrayBuffer());
    const bucle = [0x21, 0xff, 0x0b, ...new TextEncoder().encode('NETSCAPE2.0'), 3, 1];
    const longitud = bucle.length + 3;
    for (let i = 0; i <= gif.length - longitud; i++) {
      if (gif[i] === 0x21 && gif[i + longitud - 1] === 0 && bucle.every((byte, j) => gif[i + j] === byte)) {
        return URL.createObjectURL(new Blob([gif.subarray(0, i), gif.subarray(i + longitud)], { type: 'image/gif' }));
      }
    }
  } catch {
    // La ruta original permite continuar si el navegador no admite la copia.
  }
  return null;
}

async function reiniciarAnimacionAnclada(ruta) {
  if (location.protocol !== 'file:') {
    try {
      if (!archivosAnclados.has(ruta)) {
        archivosAnclados.set(ruta, fetch(ruta, { signal: AbortSignal.timeout(7000) }).then(respuesta => {
          if (!respuesta.ok) throw new Error('Animación no disponible');
          return respuesta.blob();
        }));
      }
      // Reutiliza los bytes, pero da a cada imagen una reproducción independiente.
      return URL.createObjectURL(await archivosAnclados.get(ruta));
    } catch {
      archivosAnclados.delete(ruta);
    }
  }
  // file:// carga la imagen directamente, sin depender de fetch.
  const url = new URL(ruta, document.baseURI);
  url.searchParams.set('intento', `${performance.timeOrigin}-${++numeroIntento}`);
  return url.href;
}

async function animarNudo(nudo) {
  if (movimientoReducido.matches) {
    reproducirNudo();
    return true;
  }

  const [rutaUnica] = await Promise.all([
    nudo.animacionAnclada ? reiniciarAnimacionAnclada(nudo.animacionAnclada) : unaVuelta(nudo.animacion),
    situarEntrada(nudo),
  ]);
  const imagen = crearAnimacion(null, nudo.encuadre.ancho, nudo.encuadre.alto);
  imagen.className = 'intento-nudo';
  imagen.classList.toggle('en-espejo', nudo.encuadre.espejo);
  imagen.classList.toggle('anclado', Boolean(nudo.animacionAnclada));
  imagen.hidden = true;
  nudo.capaAnimada = imagen;
  colocarAnimacion(nudo);
  recorrido.append(imagen);

  try {
    const cargada = new Promise(resolve => {
      imagen.addEventListener('load', () => resolve(true), { once: true });
      imagen.addEventListener('error', () => resolve(false), { once: true });
    });
    let limite;
    const esperaCarga = new Promise(resolve => { limite = setTimeout(() => resolve(false), 7000); });
    imagen.src = rutaUnica || nudo.animacion;
    const lista = await Promise.race([cargada, esperaCarga]);
    clearTimeout(limite);
    if (!lista) return false;
    if (movimientoReducido.matches) return true;

    nudo.boton.classList.add('en-animacion');
    personaje.classList.add('fuera-de-escena');
    imagen.hidden = false;
    reproducirNudo();
    mostrarDolor(nudo);
    actualizarHilos();
    const duracion = nudo.animacionAnclada || rutaUnica ? nudo.duracion : nudo.duracion - 40;
    await new Promise(resolve => setTimeout(resolve, duracion));
    resolverNudo(nudo);
    if (!movimientoReducido.matches && typeof imagen.animate === 'function') {
      await imagen.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 250, easing: 'ease-out', fill: 'forwards',
      }).finished.catch(() => {});
    }
    return true;
  } finally {
    imagen.remove();
    nudo.capaAnimada = null;
    if (!nudoConPose) personaje.classList.remove('fuera-de-escena');
    nudo.boton.classList.remove('en-animacion');
    actualizarHilos();
    if (rutaUnica?.startsWith('blob:')) URL.revokeObjectURL(rutaUnica);
  }
}

function resolverNudo(nudo) {
  jugador.limite = null;
  ladoTope = 0;
  nudo.temblorTope?.cancel();
  jugador.x = nudo.posicion.salida;
  presentacionPersonaje.orientar(nudo.encuadre.espejo ? -1 : 1);
  nudoConPose = nudo;
  personaje.classList.add('fuera-de-escena');
  nudo.boton.dataset.estado = 'desenredado';
  nudo.boton.tabIndex = -1;
  if (nudo.dato && nudo !== entradaFinal) {
    nudo.boton.setAttribute('aria-label', 'Volver a leer: ' + nudo.titulo);
  } else nudo.boton.setAttribute('aria-disabled', 'true');
  actualizarProgreso();
  if (nudo === entradaFinal) {
    progreso.classList.add('progreso-oculto');
    progreso.inert = true;
  }
  nudo.continuacion.forEach(elemento => elemento.removeAttribute('hidden'));
  if (nudo !== entradaFinal) precargarEscenas(escenas.findIndex(escena => escena.nudo === nudo) + 1);
  medirArea();
}

async function activarNudo(nudo) {
  if (nudo.boton.dataset.estado === 'desenredado') {
    if (estaCerca(nudo)) releerNudo(nudo);
    return;
  }
  if (nudoEnCurso || ventana.open || nudo.boton.dataset.estado !== 'enredado' || !nudoListo(nudo)) return;
  if (!estaCerca(nudo)) {
    aviso.textContent = 'Acércate al nudo para deshacerlo.';
    return;
  }

  nudoEnCurso = nudo;
  if (!sinSonido) audio.desbloquear();
  if (ultimaEscenaSonora) audio.detenerEfecto(0.3, ultimaEscenaSonora);
  controles.inert = true;
  soltarControles();
  presentacionPersonaje.pausar(true);
  actualizarNudoCercano();
  actualizarIlustraciones();
  if (!(await animarNudo(nudo))) {
    nudoEnCurso = null;
    controles.inert = false;
    presentacionPersonaje.pausar(false);
    aviso.textContent = 'No se pudo cargar la animación. Inténtalo de nuevo.';
    recorrido.focus({ preventScroll: true });
    actualizarNudoCercano();
    actualizarIlustraciones();
    return;
  }

  if (nudo.boton.dataset.estado !== 'desenredado') resolverNudo(nudo);
  if (nudo === entradaFinal) {
    nudoEnCurso = null;
    presentandoFinal = true;
    audio.terminarRecorrido();
    finalRecorrido.iniciar({
      sprite: dibujoPersonaje.getAttribute('src'),
      origen: () => personaje.getBoundingClientRect(),
      preparar: prepararCreditosFinales,
      terminar: mostrarCierre,
    });
    return;
  }
  abrirDato(nudo);
  nudoEnCurso = null;
}

nudos.forEach(nudo => nudo.boton.addEventListener('click', () => activarNudo(nudo)));
async function cerrarTarjeta(evento) {
  evento.preventDefault();
  if (!ventana.open || ventana.classList.contains('cerrando')) return;
  audio.detenerEfecto(0.6, 'tarjeta');
  if (!movimientoReducido.matches) {
    ventana.classList.add('cerrando');
    const salida = ventana.getAnimations().find(animacion => animacion.animationName === 'salida-tarjeta');
    if (salida) {
      // La tarjeta debe cerrar aun si el navegador suspende su animación al cambiar de pestaña.
      await new Promise(resolve => setTimeout(resolve, salida.effect.getComputedTiming().endTime));
    }
  }
  ventana.close();
}

ventana.addEventListener('submit', cerrarTarjeta);
ventana.addEventListener('cancel', cerrarTarjeta);
ventana.addEventListener('close', () => {
  ventana.classList.remove('cerrando');
  ventana.querySelector('.dato').replaceChildren();
  reanudarRecorrido();
});

function prepararCreditosFinales() {
  recorrido.classList.add('recorrido-completo');
  recorrido.querySelectorAll(':scope > :not(.epilogo)').forEach(elemento => { elemento.hidden = true; });
  controles.hidden = true;
}

function mostrarCierre() {
  window.scrollTo({ top: 0, behavior: 'instant' });
  const cierre = finalRecorrido.epilogo;
  cierre.tabIndex = -1;
  cierre.focus({ preventScroll: true });
}

function reanudarRecorrido() {
  controles.inert = false;
  soltarControles();
  presentacionPersonaje.pausar(false);
  recorrido.focus({ preventScroll: true });
  actualizarIlustraciones();
  actualizarLecturas();
  if (!jugador.apoyo) programarFotograma();
}
ventana.addEventListener('click', evento => {
  if (evento.target === ventana) cerrarTarjeta(evento);
});

const ilustraciones = recorrido.querySelectorAll('[data-animacion-narrativa]');
const figurasVisibles = new Set();
const escenasEscuchadas = new Set();
let ultimaEscenaSonora;

function actualizarEfectosEscena() {
  const elegibles = !document.hidden && !ventana.open && !presentandoFinal && !nudoEnCurso &&
    !documento.classList.contains('esperando-ilustracion') && !tensado;
  if (ultimaEscenaSonora && (!figurasVisibles.has(ultimaEscenaSonora.figura) || ultimaEscenaSonora.articulo.hidden)) {
    audio.detenerEfecto(0.6, ultimaEscenaSonora);
    ultimaEscenaSonora = undefined;
  }
  if (!elegibles || !audio.puedeSonar) return;
  const escena = escenas.find(({ figura, articulo, nudo }) => figurasVisibles.has(figura) &&
    !articulo.hidden && articulo.dataset.lectura !== 'hilo' && nudo.sonido &&
    !escenasEscuchadas.has(articulo));
  if (!escena) return;
  escenasEscuchadas.add(escena.articulo);
  ultimaEscenaSonora = escena;
  audio.reproducirEfecto(escena.nudo.sonido, escena, 0.45);
}
const elementosLecturaVisibles = new Set();

function nudoListo(nudo) {
  const fase = nudo.articulo.dataset.lectura;
  return fase ? fase === 'lista' : !documento.classList.contains('esperando-nudo');
}

function pasarFaseLectura(escena, fase, duracion) {
  escena.articulo.dataset.lectura = fase;
  escena.pausaActiva = true;
  setTimeout(() => {
    escena.pausaActiva = false;
    actualizarLecturas();
  }, duracion);
}

function actualizarLecturas() {
  if (ventana.open || nudoEnCurso || document.hidden) return;
  escenas.forEach((escena, indice) => {
    if (indice === 0 || escena.articulo.hidden || escena.pausaActiva) return;
    const { articulo, nudo } = escena;
    const previo = escenas[indice - 1].nudo;
    const fase = articulo.dataset.lectura;
    const sinMovimiento = movimientoReducido.matches;

    if (fase === 'hilo' && (!previo.revelado || previo.revelado.completo)) {
      const figura = articulo.querySelector('.ilustracion');
      pasarFaseLectura(escena, 'ilustracion', !sinMovimiento && figura ? 600 : 0);
      actualizarIlustraciones();
    } else if (fase === 'ilustracion') {
      pasarFaseLectura(escena, 'relato', sinMovimiento ? 0 : 700);
    } else if (fase === 'relato' && elementosLecturaVisibles.has(nudo.texto)) {
      const palabras = nudo.texto.textContent.trim().split(/\s+/).length;
      pasarFaseLectura(escena, 'pausa', limitar(palabras * 250, 2500, 6000));
    } else if (fase === 'pausa' && elementosLecturaVisibles.has(nudo.boton)) {
      pasarFaseLectura(escena, 'nudo', sinMovimiento ? 0 : 600);
      actualizarPoseNudo(nudo, true);
    } else if (fase === 'nudo') {
      articulo.dataset.lectura = 'lista';
      nudo.boton.inert = false;
      nudo.capasHilo.enredado.classList.remove('entrada-nudo-lectura');
      actualizarNudoCercano();
    }
  });
}

function actualizarIlustraciones() {
  actualizarEfectosEscena();
  for (const figura of ilustraciones) {
    const activa = figurasVisibles.has(figura) && !movimientoReducido.matches &&
      !document.hidden && !ventana.open && !presentandoFinal && !nudoEnCurso &&
      !documento.classList.contains('esperando-ilustracion') && !tensado &&
      figura.closest('.escena').dataset.lectura !== 'hilo';
    const animacion = figura.querySelector('.en-movimiento');

    if (activa && !animacion) {
      const fija = figura.querySelector('.fija');
      const imagen = crearAnimacion(figura.dataset.animacionNarrativa,
        fija.naturalWidth || 640, fija.naturalHeight || 360);
      imagen.className = 'en-movimiento';
      imagen.hidden = true;
      figura.append(imagen);
      imagen.decode().then(() => {
        imagen.hidden = false;
        if (imagen.isConnected) figura.querySelector('.fija').style.visibility = 'hidden';
      }, () => imagen.remove());
    } else if (!activa && animacion) {
      animacion.remove();
      figura.querySelector('.fija').style.removeProperty('visibility');
    }
  }
}

if ('IntersectionObserver' in window) {
  const observador = new IntersectionObserver(entradas => {
    for (const { target, isIntersecting } of entradas) {
      if (isIntersecting) figurasVisibles.add(target);
      else figurasVisibles.delete(target);
    }
    actualizarIlustraciones();
    actualizarLecturas();
  }, { threshold: 0.1 });
  recorrido.querySelectorAll('.ilustracion').forEach(figura => observador.observe(figura));

  const observadorLectura = new IntersectionObserver(entradas => {
    for (const { target, isIntersecting, intersectionRatio } of entradas) {
      if (isIntersecting && intersectionRatio > 0) elementosLecturaVisibles.add(target);
      else elementosLecturaVisibles.delete(target);
    }
    actualizarLecturas();
  }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
  escenas.slice(1).forEach(({ nudo }) => {
    observadorLectura.observe(nudo.texto);
    observadorLectura.observe(nudo.boton);
  });
}

function revelarRecorrido() {
  documento.classList.remove('presentando-personaje', 'esperando-relato', 'esperando-ilustracion',
    'esperando-nudo', 'esperando-controles');
  actualizarHilos();
  actualizarNudoCercano();
  actualizarIlustraciones();
}

if (!documento.classList.contains('presentando-personaje')) mostrarAyudaTeclado();
punteroFino.addEventListener('change', () => {
  if (!punteroFino.matches) ayudaTeclado.hidden = true;
});

function iniciarEntrada() {
  if (!documento.classList.contains('presentando-personaje')) return;
  documento.classList.remove('presentando-personaje');

  const gif = ilustraciones[0]?.dataset.animacionNarrativa;
  if (gif) {
    const precarga = document.createElement('link');
    precarga.rel = 'preload';
    precarga.as = 'image';
    precarga.href = gif;
    document.head.append(precarga);
  }

  setTimeout(() => documento.classList.remove('esperando-relato'), 800);
  setTimeout(() => {
    documento.classList.remove('esperando-ilustracion');
    actualizarIlustraciones();
  }, 1400);
  setTimeout(() => {
    documento.classList.remove('esperando-nudo');
    actualizarHilos();
    if (!movimientoReducido.matches) {
      const { entrada, enredado } = escenas[0].nudo.capasHilo;
      [entrada, enredado].forEach(capa => {
        capa.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 700, easing: 'ease-out' });
      });
    }
    actualizarNudoCercano();
  }, 2000);
  setTimeout(() => {
    documento.classList.remove('esperando-controles');
    mostrarAyudaTeclado();
  }, 2600);
}

if (documento.classList.contains('presentando-personaje')) {
  recorrido.addEventListener('focus', iniciarEntrada, { once: true });
  Promise.race([
    dibujoPersonaje.decode().catch(() => {}),
    new Promise(resolve => setTimeout(resolve, 1000)),
  ]).then(() => setTimeout(iniciarEntrada, 1200));
}

movimientoReducido.addEventListener('change', () => {
  if (movimientoReducido.matches) pulsoDolor.getAnimations().forEach(animacion => animacion.cancel());
  revelarRecorrido();
  actualizarDesenrollado();
  const imagen = ventana.querySelector('.dato-ilustracion[data-animacion]');
  if (imagen) imagen.src = movimientoReducido.matches ? imagen.dataset.fija : imagen.dataset.animacion;
  actualizarLecturas();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) soltarControles();
  else if (!jugador.apoyo) programarFotograma();
  actualizarIlustraciones();
  actualizarLecturas();
});

medirArea();
// Las webfonts pueden cambiar la altura de los relatos al cargar o al abrir otra escena.
window.addEventListener('scroll', () => {
  orientarIndicacion();
  situarClaroFinal();
}, { passive: true });
document.fonts.ready.then(medirArea);
document.fonts.addEventListener('loadingdone', medirArea);
const observadorArea = new ResizeObserver(medirArea);
observadorArea.observe(recorrido);
escenas.forEach(({ articulo, nudo }) => {
  observadorArea.observe(articulo);
  observadorArea.observe(nudo.apoyo);
});
