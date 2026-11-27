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
  if (revelado.completo && !revelado.conservarMascara) revelado.imagen.removeAttribute('mask');
  return revelado.completo;
}

function crearDesvioHilo(id) {
  const svg = etiqueta => document.createElementNS('http://www.w3.org/2000/svg', etiqueta);
  const capa = document.createElement('div');
  capa.className = 'tramo-hilo hilo-salida hilo-hacia-final';
  capa.hidden = true;
  capa.setAttribute('aria-hidden', 'true');
  const dibujo = svg('svg');
  const mascara = svg('mask');
  mascara.id = `mascara-hilo-${id}`;
  mascara.setAttribute('maskUnits', 'userSpaceOnUse');
  mascara.setAttribute('maskContentUnits', 'userSpaceOnUse');
  const guia = svg('path');
  guia.setAttribute('fill', 'none');
  guia.setAttribute('stroke', 'white');
  guia.setAttribute('stroke-width', '8');
  guia.setAttribute('stroke-linecap', 'round');
  mascara.append(guia);
  const imagen = svg('g');
  imagen.setAttribute('mask', `url(#${mascara.id})`);
  dibujo.append(mascara, imagen);
  capa.append(dibujo);
  return { capa, dibujo, mascara, guia, imagen, segmentos: [],
    conservarMascara: true, revelado: 0, completo: false };
}

function colocarDesvioHilo(revelado, recurso, inicio, fin, ancho, texto8, texto9) {
  const y = inicio.y - 12;
  const alto = fin.y - y + 12;
  const izquierda8 = Math.max(22, texto8.izquierda - 22);
  const izquierda9 = Math.max(22, Math.min(izquierda8, texto9.izquierda - 22));
  const antes8 = texto8.arriba - 14 - y;
  const despues8 = texto8.abajo + 10 - y;
  const antes9 = texto9.arriba - 14 - y;
  const despues9 = texto9.abajo + 13 - y;
  const finalY = fin.y - y;
  const { capa, dibujo, mascara, guia, imagen, segmentos } = revelado;
  capa.style.cssText = `width:${ancho}px;height:${alto}px;top:${y}px`;
  dibujo.setAttribute('viewBox', `0 0 ${ancho} ${alto}`);
  mascara.setAttribute('x', 0);
  mascara.setAttribute('y', 0);
  mascara.setAttribute('width', ancho);
  mascara.setAttribute('height', alto);
  guia.setAttribute('d', [
    `M ${inicio.x} ${inicio.y - y}`,
    `C ${inicio.x - 52} ${inicio.y - y + 3}, ${izquierda8} ${antes8 - 39}, ${izquierda8} ${antes8}`,
    `C ${izquierda8} ${despues8}, ${izquierda9} ${antes9 - 55}, ${izquierda9} ${antes9}`,
    `C ${izquierda9} ${antes9 + 48}, ${izquierda9} ${despues9 - 32}, ${izquierda9} ${despues9}`,
    `C ${izquierda9} ${finalY + 8}, ${fin.x - 70} ${finalY + 13}, ${fin.x} ${finalY}`,
  ].join(' '));

  const longitud = guia.getTotalLength();
  const escala = 0.54;
  const cantidad = Math.ceil(longitud / 19) + 1;
  while (segmentos.length > cantidad) segmentos.pop().remove();
  while (segmentos.length < cantidad) {
    const tramo = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    tramo.setAttribute('href', recurso.archivo);
    tramo.setAttribute('width', recurso.ancho);
    tramo.setAttribute('height', recurso.alto);
    imagen.append(tramo);
    segmentos.push(tramo);
  }

  // Solo se ve la tinta original. Cada muestra conserva escala uniforme y gira con la curva de la máscara.
  segmentos.forEach((tramo, i) => {
    const distancia = i * longitud / (cantidad - 1);
    const centro = guia.getPointAtLength(distancia);
    const antes = guia.getPointAtLength(Math.max(0, distancia - 2));
    const despues = guia.getPointAtLength(Math.min(longitud, distancia + 2));
    const angulo = Math.atan2(despues.y - antes.y, despues.x - antes.x) * 180 / Math.PI - 90;
    tramo.setAttribute('transform', `translate(${centro.x} ${centro.y}) rotate(${angulo}) scale(${escala})
      translate(${-recurso.inicioX} ${-recurso.alto / 2})`);
  });

  const divisiones = Math.ceil(longitud / 7);
  revelado.muestras = Array.from({ length: divisiones + 1 }, (_, i) => {
    const distancia = i * longitud / divisiones;
    const punto = guia.getPointAtLength(distancia);
    return { x: punto.x, y: punto.y + y, local: distancia, mundo: distancia };
  });
  revelado.total = longitud;
  revelado.revelado = revelado.completo ? longitud : Math.min(revelado.revelado, longitud);
  guia.setAttribute('stroke-dasharray', `${longitud} ${longitud}`);
  guia.setAttribute('stroke-dashoffset', longitud - revelado.revelado);
}
