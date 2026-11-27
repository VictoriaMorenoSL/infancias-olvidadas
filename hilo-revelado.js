// Centros de la tinta de hilo-salida-orfanato.svg, medidos cada 12 px de alto.
const centrosSalidaOrfanato = [
  548.99, 549.03, 547.81, 545.08, 546.16, 545.11, 544.47, 544, 543.77, 542.94, 542.53,
  542.49, 542.5, 542.74, 542.87, 542.9, 543.36, 544.06, 544.86, 546, 547.5, 549.29,
  550.91, 552.9, 554.77, 556.5, 557.77, 559.73, 560.81, 562.43, 564.5, 566.25, 565.23,
  565.11, 565.13, 565.49, 565.13, 564.87, 563.38, 562.1, 560.35, 558.5, 556, 554.03,
  551.9, 549.41, 548, 545.06, 540.89, 538.44, 536.15, 532.59, 529.57, 525.67, 522.72,
  518.3, 513.51, 508.54, 501.77, 497.63, 492.57, 487.83, 480.97, 475.74, 468.81,
  461.1, 452.3, 443.64, 433.69, 424.09, 413.43, 402.1, 390.73, 376, 361.08, 342.94,
  324.28, 297.8, 263.9, 204.09, 147.69, 103.39, 83.93, 71.54, 61.75, 54.45, 49.05,
  42.78, 39.71, 38.11, 37.09, 36.48, 34.96, 34.17, 33.01, 33.44,
];

function crearReveladoHilo(recurso, id) {
  if (!recurso.archivo.endsWith('/hilo-mano-orfanato.svg') && !recurso.recorteY && !recurso.recto) return null;

  const svg = (nombre, atributos) => {
    const elemento = document.createElementNS('http://www.w3.org/2000/svg', nombre);
    for (const [clave, valor] of Object.entries(atributos)) elemento.setAttribute(clave, valor);
    return elemento;
  };
  // Primera sección medida en el fotograma final, desde la mano hasta el empalme.
  const mano = [
    [185, 205], [190, 203.5], [195, 196.5], [200, 193], [210, 185.5], [220, 181.5],
    [230, 179], [245, 177], [260, 179.5], [270, 183.5], [275, 183], [280, 189],
    [285, 193], [290, 198.5], [295, 205], [300, 212.5], [305, 224], [310, 237],
    [315, 250], [320, 263], [325, 275], [330, 284.5], [335, 292], [340, 297.5],
    [345, 302.5], [350, 306.5], [355, 310], [370, 316.5], [380, 319.5], [399, 322], [438, 322], [470, 322], [489, 326],
    [510, 334], [527, 347], [543, 359],
  ].map(([x, y]) => ({ x: 50 + (x - 185) * 2, y: 50 + (y - 202) * 2 }));
  const puntosCurvos = mano.concat(centrosSalidaOrfanato.slice(1).map((x, i) => ({
    x: x + 219, y: 361 + Math.min(12 * (i + 1), 1130),
  }))).filter(({ y }) => y > (recurso.recorteY ?? 0))
    .map(({ x, y }) => ({ x, y: y - (recurso.recorteY ?? 0) }));
  if (recurso.recorteY) puntosCurvos.unshift({ x: recurso.inicioX, y: 0 });
  const puntos = recurso.recto ? [{ x: recurso.inicioX, y: 0 }, { x: recurso.finX, y: recurso.alto }] : puntosCurvos;
  const capa = document.createElement('div');
  capa.className = 'tramo-hilo hilo-salida';
  capa.setAttribute('aria-hidden', 'true');
  capa.hidden = true;
  const dibujo = svg('svg', { viewBox: `0 0 ${recurso.ancho} ${recurso.alto}` });
  const mascara = svg('mask', {
    id: `mascara-hilo-${id}`,
    maskUnits: 'userSpaceOnUse',
    x: 0, y: 0, width: recurso.ancho, height: recurso.alto,
  });
  // 38 px cubren la tinta completa, incluida la textura alrededor del centro.
  const guia = svg('polyline', {
    points: puntos.map(({ x, y }) => `${x},${y}`).join(' '),
    fill: 'none', stroke: 'white', 'stroke-width': 38,
    'stroke-linecap': 'round', 'stroke-linejoin': 'round',
  });
  const imagen = svg('image', {
    href: recurso.archivo, width: recurso.ancho, height: recurso.alto,
    mask: `url(#${mascara.id})`,
  });
  mascara.append(guia);
  dibujo.append(mascara, imagen);
  capa.append(dibujo);
  return { capa, guia, imagen, puntos, revelado: 0, completo: false };
}

function medirRevelado(revelado, { sx, sy, inclinacion, x, y }) {
  let local = 0;
  let mundo = 0;
  revelado.muestras = revelado.puntos.map((punto, i, puntos) => {
    if (i) {
      const dx = punto.x - puntos[i - 1].x;
      const dy = punto.y - puntos[i - 1].y;
      local += Math.hypot(dx, dy);
      mundo += Math.hypot(sx * dx + inclinacion * dy, sy * dy);
    }
    return { x: x + sx * punto.x + inclinacion * punto.y, y: y + sy * punto.y, local, mundo };
  });
  revelado.total = local;
  revelado.guia.setAttribute('stroke-dasharray', `${local} ${local}`);
  revelado.guia.setAttribute('stroke-dashoffset', local - revelado.revelado);
}

function avanzarRevelado(revelado, x, y, completar) {
  if (!revelado?.muestras || revelado.completo) return false;

  let recorrido = 0;
  let menorDistancia = Infinity;
  const muestras = revelado.muestras;
  if (!completar) {
    for (let i = 1; i < muestras.length; i++) {
      const a = muestras[i - 1];
      const b = muestras[i];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy)));
      const distancia = (x - a.x - t * dx) ** 2 + (y - a.y - t * dy) ** 2;
      if (distancia < menorDistancia) {
        menorDistancia = distancia;
        recorrido = a.mundo + t * (b.mundo - a.mundo);
      }
    }
  }

  // La punta se adelanta 18 px de pantalla. El máximo se guarda en el dibujo original.
  const punta = recorrido + 18;
  let visible = revelado.total;
  if (!completar && punta < muestras.at(-1).mundo) {
    const i = muestras.findIndex(punto => punto.mundo >= punta);
    const a = muestras[i - 1];
    const b = muestras[i];
    visible = a.local + (b.local - a.local) * (punta - a.mundo) / (b.mundo - a.mundo);
  }

  revelado.revelado = Math.max(revelado.revelado, visible);
  revelado.completo = revelado.revelado >= revelado.total;
  revelado.guia.setAttribute('stroke-dashoffset', revelado.total - revelado.revelado);
  if (revelado.completo) revelado.imagen.removeAttribute('mask');
  return revelado.completo;
}

function crearDesvioHilo(recurso, id) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = etiqueta => document.createElementNS(ns, etiqueta);
  const capa = document.createElement('div');
  capa.className = 'tramo-hilo hilo-salida hilo-hacia-final';
  capa.hidden = true;
  capa.setAttribute('aria-hidden', 'true');
  const dibujo = svg('svg');
  const mascara = svg('mask');
  mascara.id = `mascara-hilo-${id}`;
  mascara.setAttribute('maskUnits', 'userSpaceOnUse');
  mascara.setAttribute('maskContentUnits', 'userSpaceOnUse');
  const guia = svg('polyline');
  guia.setAttribute('fill', 'none');
  guia.setAttribute('stroke', 'white');
  guia.setAttribute('stroke-width', '14');
  guia.setAttribute('stroke-linejoin', 'round');
  guia.setAttribute('stroke-linecap', 'round');
  mascara.append(guia);
  const imagen = svg('g');
  imagen.setAttribute('mask', `url(#${mascara.id})`);
  const segmentos = Array.from({ length: 5 }, () => {
    const tramo = svg('image');
    tramo.setAttribute('href', recurso.archivo);
    tramo.setAttribute('width', recurso.ancho);
    tramo.setAttribute('height', recurso.alto);
    return tramo;
  });
  imagen.append(...segmentos);
  dibujo.append(mascara, imagen);
  capa.append(dibujo);
  return { capa, dibujo, mascara, guia, imagen, segmentos, revelado: 0, completo: false };
}

function colocarDesvioHilo(revelado, recurso, inicio, fin, ancho, textoArriba) {
  const margen = 8;
  const giro = Math.max(inicio.y, Math.min(inicio.y + 23, textoArriba - 7));
  const puntos = [
    inicio,
    { x: ancho - margen - 9, y: giro },
    { x: ancho - margen, y: giro + 12 },
    { x: ancho - margen, y: fin.y - 34 },
    { x: ancho - margen - 11, y: fin.y - 20 },
    fin,
  ];
  const y = inicio.y - 6;
  const alto = fin.y - y + 8;
  const { capa, dibujo, mascara, guia, segmentos } = revelado;
  capa.style.cssText = `width:${ancho}px;height:${alto}px;top:${y}px`;
  dibujo.setAttribute('viewBox', `0 0 ${ancho} ${alto}`);
  mascara.setAttribute('x', 0);
  mascara.setAttribute('y', 0);
  mascara.setAttribute('width', ancho);
  mascara.setAttribute('height', alto);
  guia.setAttribute('points', puntos.map(punto => `${punto.x},${punto.y - y}`).join(' '));

  let longitud = 0;
  revelado.muestras = puntos.map((punto, i) => {
    if (i) {
      const previo = puntos[i - 1];
      const dx = punto.x - previo.x;
      const dy = punto.y - previo.y;
      const largo = Math.hypot(dx, dy);
      const espesor = Math.max(2.5, ancho / 130) / recurso.grosor;
      const ax = dy / largo * espesor;
      const ay = -dx / largo * espesor;
      const bx = dx / recurso.alto;
      const by = dy / recurso.alto;
      const ox = previo.x - ax * recurso.inicioX - dx / largo;
      const oy = previo.y - y - ay * recurso.inicioX - dy / largo;
      segmentos[i - 1].setAttribute('transform', `matrix(${ax} ${ay} ${bx * (1 + 2/largo)} ${by * (1 + 2/largo)} ${ox} ${oy})`);
      longitud += largo;
    }
    return { ...punto, local: longitud, mundo: longitud };
  });
  revelado.total = longitud;
  if (!revelado.completo) {
    guia.setAttribute('stroke-dasharray', `${longitud} ${longitud}`);
    guia.setAttribute('stroke-dashoffset', Math.max(0, longitud - revelado.revelado));
  }
}
