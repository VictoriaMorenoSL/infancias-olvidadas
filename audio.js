function prepararAudioExperiencia(sonidos) {
  const rutas = new Map();
  const ContextoAudio = window.AudioContext || window.webkitAudioContext;
  const canales = {};
  let contexto;
  let maestro;
  let silenciado = false;
  let enRecorrido = true;
  let enEscenaFinal = false;
  let fondoIniciado = false;
  let efecto;
  let pendiente;
  let turnoEfecto = 0;
  let pistaFinal;
  let fondo;
  let detenerFinal;
  const vocesLocales = new Set();
  let relojLocal;

  function fundir(parametro, valor, segundos, desde) {
    const ahora = contexto.currentTime;
    if (!segundos) {
      parametro.cancelScheduledValues(ahora);
      parametro.value = valor;
      return;
    }
    const actual = desde ?? parametro.value;
    parametro.cancelScheduledValues(ahora);
    parametro.setValueAtTime(actual, ahora);
    parametro.linearRampToValueAtTime(valor, ahora + segundos);
  }

  function desbloquear() {
    if (!ContextoAudio || silenciado) return false;
    if (!contexto) {
      try { contexto = new ContextoAudio(); } catch { return false; }
      maestro = contexto.createGain();
      maestro.connect(contexto.destination);
      for (const nombre of ['fondo', 'efectos', 'pasos', 'final']) {
        const canal = contexto.createGain();
        canal.gain.value = nombre === 'pasos' ? 1 : 0;
        canal.connect(maestro);
        canales[nombre] = canal;
      }
    }
    if (contexto.state !== 'running') contexto.resume().catch(() => {});
    return true;
  }

  function precargar(ruta) {
    if (!ruta || rutas.has(ruta)) return;
    const recurso = {};
    if (location.protocol === 'file:') {
      recurso.pista = new Audio();
      recurso.pista.preload = 'auto';
      recurso.pista.src = ruta;
    } else {
      recurso.bytes = fetch(ruta).then(respuesta => respuesta.ok ? respuesta.arrayBuffer() : null).catch(() => null);
    }
    rutas.set(ruta, recurso);
  }

  async function reproducir(ruta, destino, { bucle = false, volumen = 1, velocidad = 1, vigente = () => true } = {}) {
    if (!desbloquear()) return null;
    precargar(ruta);
    const recurso = rutas.get(ruta);
    if (!recurso.pista) {
      recurso.buffer ??= recurso.bytes.then(bytes => bytes ? contexto.decodeAudioData(bytes) : null).catch(() => null);
      const buffer = await recurso.buffer;
      if (!buffer || silenciado || !vigente()) return null;
      const fuente = contexto.createBufferSource();
      const ganancia = contexto.createGain();
      ganancia.gain.value = volumen;
      fuente.buffer = buffer;
      fuente.loop = bucle;
      fuente.playbackRate.value = velocidad;
      fuente.connect(ganancia).connect(destino);
      fuente.addEventListener('ended', () => { fuente.disconnect(); ganancia.disconnect(); }, { once: true });
      fuente.start();
      return { detener: () => fuente.stop(), alTerminar: fn => fuente.addEventListener('ended', fn, { once: true }) };
    }

    if (!vigente()) return null;
    // file:// permite reproducir el medio, pero el navegador silencia su salida a Web Audio.
    try {
      const pista = destino === canales.pasos ? recurso.pista.cloneNode() : recurso.pista;
      const canal = destino.gain ? destino : canales.final;
      const voz = { pista, canal, volumen };
      function limpiar() {
        pista.removeEventListener('ended', limpiar);
        vocesLocales.delete(voz);
        if (!vocesLocales.size) {
          clearInterval(relojLocal);
          relojLocal = undefined;
        }
      }
      pista.loop = bucle;
      pista.playbackRate = velocidad;
      pista.currentTime = 0;
      vocesLocales.add(voz);
      actualizarVocesLocales();
      relojLocal ??= setInterval(actualizarVocesLocales, 25);
      pista.addEventListener('ended', limpiar, { once: true });
      const lista = await pista.play().then(() => true, () => false);
      if (!lista || !vigente()) {
        pista.pause();
        limpiar();
        return null;
      }
      return {
        detener() { pista.pause(); limpiar(); },
        alTerminar: fn => pista.addEventListener('ended', fn, { once: true }),
      };
    } catch {
      return null;
    }
  }

  function actualizarVocesLocales() {
    for (const { pista, canal, volumen } of vocesLocales) {
      pista.muted = silenciado;
      pista.volume = Math.min(1, Math.max(0, canal.gain.value * volumen));
    }
  }

  function actualizarFondo() {
    if (!fondo || !enRecorrido) return;
    const volumen = efecto ? 0.08 : enEscenaFinal ? 0.10 : 0.18;
    fundir(canales.fondo.gain, volumen, efecto ? 0.3 : 0.8);
  }

  async function iniciarFondo() {
    if (!enRecorrido || fondoIniciado || !desbloquear()) return;
    fondoIniciado = true;
    fondo = await reproducir(sonidos.fondo, canales.fondo, { bucle: true, vigente: () => enRecorrido });
    if (!fondo) {
      fondoIniciado = false;
      return;
    }
    fundir(canales.fondo.gain, efecto ? 0.08 : enEscenaFinal ? 0.10 : 0.18, 3, 0);
  }

  function soltarEfecto() {
    if (efecto) {
      const anterior = efecto;
      efecto = null;
      anterior.voz.detener();
    }
    actualizarFondo();
  }

  const esperar = ms => new Promise(resolve => setTimeout(resolve, ms));

  async function detenerEfecto(segundos = 0, origen) {
    if (origen && efecto?.origen !== origen) {
      if (pendiente !== origen) return;
      // Si había un relevo pendiente, termina también la salida de la voz anterior.
    }
    const turno = ++turnoEfecto;
    pendiente = null;
    if (!efecto) return;
    if (segundos) {
      fundir(canales.efectos.gain, 0, segundos);
      await esperar(segundos * 1000);
    }
    if (turno === turnoEfecto) soltarEfecto();
  }

  async function reproducirEfecto(ruta, origen, volumen, inmediato = false) {
    if (!ruta || !enRecorrido || !desbloquear()) return false;
    const turno = ++turnoEfecto;
    pendiente = origen;
    if (efecto && !inmediato) {
      fundir(canales.efectos.gain, 0, 0.3);
      await esperar(300);
    }
    if (turno !== turnoEfecto) return false;
    // El efecto anterior ya bajó a cero. El nudo entra en el cuadro de inicio de su animación.
    soltarEfecto();
    const vigente = () => turno === turnoEfecto && enRecorrido;
    const voz = await reproducir(ruta, canales.efectos, { vigente });
    if (!voz) {
      if (vigente()) pendiente = null;
      return false;
    }
    if (!vigente()) {
      voz.detener();
      return false;
    }
    pendiente = null;
    efecto = { voz, origen };
    fundir(canales.efectos.gain, volumen, 0, volumen);
    actualizarFondo();
    voz.alTerminar(() => { if (efecto?.voz === voz) { efecto = null; actualizarFondo(); } });
    return true;
  }

  function paso(ruta, volumen, velocidad, vigente) {
    if (!enRecorrido || !desbloquear()) return;
    reproducir(ruta, canales.pasos, { volumen, velocidad, vigente });
  }

  function marcarEscenaFinal() {
    enEscenaFinal = true;
    precargar(sonidos.final);
    actualizarFondo();
  }

  async function terminarRecorrido() {
    enRecorrido = false;
    detenerEfecto();
    if (!contexto) return;
    fundir(canales.fondo.gain, 0, 1.5);
    fundir(canales.pasos.gain, 0, 1.5);
    await esperar(1500);
    fundir(canales.fondo.gain, 0, 0, 0);
    fundir(canales.pasos.gain, 0, 0, 0);
    fondo?.detener();
    fondo = null;
  }

  let turnoFinal = 0;
  let finalSolicitado = false;
  let salidaFinal = false;
  function detener() {
    clearTimeout(detenerFinal);
    turnoFinal += 1;
    finalSolicitado = false;
    salidaFinal = false;
    if (contexto) fundir(canales.final.gain, 0, 0, 0);
    pistaFinal?.detener();
    pistaFinal = null;
  }

  async function iniciar(segundos = 4) {
    detener();
    finalSolicitado = true;
    if (!desbloquear()) return;
    const turno = turnoFinal;
    const filtro = contexto.createBiquadFilter();
    filtro.type = 'lowpass';
    filtro.frequency.value = 800;
    filtro.Q.value = 0.707;
    filtro.connect(canales.final);
    const vigente = () => turno === turnoFinal && finalSolicitado && !salidaFinal;
    const voz = await reproducir(sonidos.final, filtro, { bucle: true, vigente });
    if (!voz || !vigente()) {
      voz?.detener();
      filtro.disconnect();
      return;
    }
    pistaFinal = { detener() { voz.detener(); filtro.disconnect(); } };
    fundir(canales.final.gain, 0.3, segundos, 0);
  }

  function salir() {
    salidaFinal = true;
    if (contexto) fundir(canales.final.gain, 0, 3);
    detenerFinal = setTimeout(detener, 3000);
  }

  function silenciar(valor) {
    silenciado = valor;
    if (maestro) maestro.gain.value = valor ? 0 : 1;
    actualizarVocesLocales();
    if (!valor && (contexto || finalSolicitado)) {
      desbloquear();
      if (enRecorrido) iniciarFondo();
      else if (finalSolicitado && !salidaFinal && !pistaFinal) iniciar(2);
    }
  }

  precargar(sonidos.fondo);
  return {
    desbloquear, silenciar, iniciarFondo, precargar, reproducirEfecto, detenerEfecto, paso,
    marcarEscenaFinal, terminarRecorrido, iniciar, salir, detener,
    get puedeSonar() { return Boolean(contexto && !silenciado); },
  };
}
