// Guion del recorrido. Cargar como script clásico antes de experiencia.js.
const fuentesPorId = {
  redim: {nombre: "REDIM, reportaje sobre reclutamiento ilícito", anio: 2023, url: "https://investigaciones.derechosinfancia.org.mx/wp-content/uploads/2023/03/Reportaje-reclutamiento-ilicito-otra-fuente_compressed-1-1.pdf"},
  escena4: {nombre: "Reinserta, “Niñas, niños y adolescentes reclutados por la delincuencia organizada” (vía El Universal)", anio: 2021, url: "https://www.eluniversal.com.mx/opinion/hector-de-mauleon/los-12-anos-yo-era-un-asesino-sueldo"},
  abandono: {nombre: "REDIM, Abandono y negligencia contra la infancia y adolescencia en México 2010-2024 (con datos de la Secretaría de Salud)", anio: 2025, url: "https://blog.derechosinfancia.org.mx/2025/08/14/abandono-y-negligencia-contra-la-infancia-y-adolescencia-en-mexico-2010-2024/"},
  sipinna: {nombre: "SIPINNA, Desamparo y penumbra: niñas, niños y adolescentes en situación de calle", anio: null, url: "https://www.gob.mx/sipinna/articulos/desamparo-y-penumbra-ninas-ninos-y-adolescentes-en-situacion-de-calle?idiom=es"},
  escena6: {nombre: "Reinserta (vía Expansión Política)", anio: 2021, url: "https://politica.expansion.mx/mexico/2021/10/13/30-000-menores-sirven-para-el-crimen-organizado"},
  escena7: {nombre: "Reinserta (vía SDP Noticias)", anio: 2021, url: "https://www.sdpnoticias.com/mexico/reinserta-analiza-reclutamiento-de-menores-por-parte-de-la-delincuencia-organizada/"},
  escena8: {nombre: "Reinserta, datos de 2022 (vía Infobae)", anio: 2026, url: "https://www.infobae.com/mexico/2026/08/05/reinserta-exige-tipificar-como-delito-en-mexico-el-reclutamiento-de-menores-por-el-crimen-organizado/"},
};
const SONIDOS = {
  fondo: './assets/audios/fondo-bucle.mp3',
  final: './assets/audios/final-bucle.mp3',
  nudo: './assets/audios/deshacer-nudo.mp3',
  pasos: ['./assets/audios/paso-1.mp3', './assets/audios/paso-2.mp3'],
};
const FUENTES = [
  ...Object.values(fuentesPorId),
  { grupo: 'Sonido', nombre: 'orfanato.mp3' }, // PENDIENTE: autor y enlace.
  { grupo: 'Sonido', nombre: 'guardia.mp3' }, // PENDIENTE: autor y enlace.
  { grupo: 'Sonido', nombre: 'escape-desconocido.mp3' }, // PENDIENTE: autor y enlace.
  { grupo: 'Sonido', nombre: 'ninos-armas.mp3' }, // PENDIENTE: autor y enlace.
  { grupo: 'Sonido', nombre: 'telefono.mp3' }, // PENDIENTE: autor y enlace.
  { grupo: 'Sonido', nombre: 'sombrero-aplaudiendo.mp3' }, // PENDIENTE: autor y enlace.
  { grupo: 'Sonido', nombre: 'fondo.mp3' }, // PENDIENTE: autor y enlace.
  { grupo: 'Sonido', nombre: 'final.mp3' }, // PENDIENTE: autor y enlace.
  { grupo: 'Sonido', nombre: '“walking”, wolfdoctor (Pixabay)' }, // PENDIENTE: enlace de la grabación.
  {
    grupo: 'Sonido',
    nombre: '“Tying Knot Rope”, sdking79 (Pixabay)',
    url: 'https://pixabay.com/sound-effects/film-special-effects-tying-knot-rope-198087/',
  },
];

const CONTENIDO = (() => {
  const hiloOrfanato = {
    entrada: {
      archivo: './assets/web/hilo-entrada-orfanato.svg',
      ancho: 40, alto: 57, inicioX: 20.14, finX: 20.16, grosor: 7,
    },
    salida: {
      archivo: './assets/web/hilo-mano-escena-2.svg',
      ancho: 860, alto: 1319, inicioX: 319.47, inicioY: 0, finX: 252.44, grosor: 15, recorteY: 172,
    },
    enredado: './assets/web/hilo-enredado-orfanato.svg',
    poseMano: './assets/web/pose-mano-orfanato.png',
  };
  const nudoOrfanato = {
    imagen: './assets/web/primer-nudo.png',
    animacion: './assets/GIFs/deshacer-nudo.gif',
    animacionAnclada: './assets/web/deshacer-nudo-anclado.png',
    duracion: 3000,
  };

  const escenas = [
    {
      id: "orfanato",
      sonido: "./assets/audios/orfanato-corto.mp3",
      titulo: "El orfanato",
      lado: "derecha",
      estiloRelato: { wght: 400, SEIS: 50 },
      relato: "<strong>Tu familia te abandonó</strong> en un lugar desconocido junto con otros niños sin sus padres y guardias amenazantes.",
      ilustracion: {
        fija: './assets/web/orfanato-transparente-fijo.png',
        animacion: './assets/web/orfanato-transparente.webp',
        posicion: 'despues',
        alt: 'Una casa al pie de una montaña, con un árbol y nubes',
      },
      nudo: {
        id: "primer-nudo",
        titulo: "Orfanatos sin registro",
        dato: {
          texto: "Nadie sabe cuántos orfanatos clandestinos maneja el narco: no hay registros sobre ellos. Tampoco sobre los niños que terminan reclutados.",
          contexto: {cifra: "0", texto: "cifras oficiales sobre cuántas niñas, niños y adolescentes han sido reclutados por la delincuencia organizada."},
          fuente: fuentesPorId.redim,
        },
      },
    },
    {
      id: "escena-2",
      sonido: "./assets/audios/guardia.mp3",
      volumenSonido: 0.65,
      titulo: "Castigos",
      lado: "izquierda",
      estiloRelato: { wght: 500, SEIS: 100 },
      relato: "Un día <strong>un guardia mata a uno de tus amigos</strong> frente a todos por desobedecer, así que decides que es hora de escapar.",
      ilustracion: {
        fija: './assets/web/guardia-fijo.png',
        animacion: './assets/web/guardia.webp',
        alt: 'Un guardia con una mancha roja',
        silueta: { ancho: 480, alto: 480, izquierda: 122, derecha: 309, arriba: 64, suela: 458 },
        posicion: 'arriba',
      },
      nudo: {
        id: "nudo-2",
        titulo: "Castigos",
        dato: {
          texto: "Estos orfanatos suelen tener a menores desde muy corta edad. Cuando no obedecen, los castigan de maneras inhumanas. Tu amigo tenía 8 años cuando lo mataron.",
          contexto: {cifra: "7 a 9 años", texto: "son las edades más tempranas de reclutamiento identificadas en México."},
          visual: "linea-edad",
          visualDatos: {rango: [7, 9], marca: 8},
          fuente: fuentesPorId.redim,
        },
      },
    },
    {
      id: "escena-3",
      sonido: "./assets/audios/escape-desconocido.mp3",
      titulo: "Territorios compartidos",
      lado: "derecha",
      estiloRelato: { wght: 400, SEIS: 0 },
      relato: "Escapas y un desconocido te da asilo, pero con un alto costo que <strong>arriesgaría tu vida</strong>.",
      ilustracion: {
        fija: './assets/web/casa-fijo.png',
        animacion: './assets/web/casa.webp',
        alt: 'Un niño en la puerta de una casa',
        posicion: 'arriba',
      },
      nudo: {
        id: "nudo-3",
        titulo: "Territorios compartidos",
        dato: {
          texto: "Escapar no siempre es salir. En un mismo estado pueden operar al mismo tiempo cárteles nacionales, grupos regionales y bandas locales: huir de uno puede significar caer en manos de otro.",
        },
      },
    },
    {
      id: "escena-4",
      sonido: "./assets/audios/ninos-armas-corto.mp3",
      titulo: "Mulas y patrullas",
      lado: "izquierda",
      estiloRelato: { wght: 400, SEIS: 0 },
      relato: "Empiezas a transportar mochilas con droga, mientras observas cómo a <strong>niños más grandes los llevan a lugares portando armas</strong>.",
      ilustracion: {
        fija: './assets/web/grupo-ninos-fijo.png',
        animacion: './assets/web/grupo-ninos.webp',
        alt: 'Cuatro niños en marcha con armas',
        posicion: 'arriba',
      },
      nudo: {
        id: "nudo-4",
        titulo: "Mulas y patrullas",
        dato: {
          texto: "Algunos grupos delictivos usan a los niños más pequeños y a las niñas como “mulas” para vender droga de forma más discreta, y a los más grandes los llevan a patrullajes armados.",
          contexto: {cifra: "9 a 11 años", texto: "edad en la que algunos niños son reclutados para llevar mensajes, vigilar, robar e incluso asesinar, según testimonios recogidos por Reinserta."},
          visual: "linea-edad",
          visualDatos: {rango: [9, 11], marca: null},
          fuente: fuentesPorId.escena4,
        },
      },
    },
    {
      id: "escena-5",
      sonido: "./assets/audios/telefono-corto.mp3",
      titulo: "Rechazo",
      lado: "derecha",
      estiloRelato: { wght: 500, SEIS: 50 },
      relato: "Te dan la opción de salir o seguir en el negocio, por lo que decides salir. Intentas comunicarte con tu familia, pero <strong>te rechazan y terminas en la calle</strong>.",
      ilustracion: {
        fija: './assets/web/telefono-fijo.png',
        animacion: './assets/web/telefono.webp',
        alt: 'Un teléfono con cable en espiral',
        posicion: 'arriba',
      },
      nudo: {
        id: "nudo-5",
        titulo: "Rechazo",
        dato: {
          texto: "Muchas veces, haber vivido una situación así genera rechazo por parte de las propias familias de los afectados.",
          contexto: {cifra: "1,282", texto: "niñas, niños y adolescentes de 1 a 17 años fueron atendidos en hospitales por abandono o negligencia en 2024: 7 veces más que en 2010 (179)."},
          visual: "barras",
          visualDatos: [{anio: 2010, valor: 179}, {anio: 2024, valor: 1282}],
          fuente: fuentesPorId.abandono,
        },
      },
    },
    {
      id: "escena-6",
      titulo: "La calle",
      lado: "izquierda",
      estiloRelato: { wght: 400, SEIS: 0 },
      relato: "La calle se vuelve tu hogar y encuentras una familia en quien apoyarte, pero mientras trabajas como lavacoches, un hombre te ofrece un nuevo <strong>trabajo con una mejor paga</strong>.",
      ilustracion: {
        fija: './assets/web/hombre-sombrero-fijo.png',
        animacion: './assets/web/hombre-sombrero.webp',
        alt: 'Un hombre con sombrero',
        posicion: 'arriba',
      },
      nudo: {
        id: "nudo-6",
        titulo: "La calle",
        dato: {
          texto: "La calle se convierte en el espacio donde “escapan” de la violencia, el maltrato y la disciplina rígida. Ahí encuentran a otras y otros en las mismas condiciones, que les ofrecen el apoyo y el cariño que no encontraron en su familia.",
          contexto: {cifra: "hasta $35,000", texto: "pesos al mes llegan a pagarles a niñas y niños reclutados, según Reinserta."},
          fuentes: [fuentesPorId.sipinna, fuentesPorId.escena6],
        },
      },
    },
    {
      id: "escena-7",
      sonido: "./assets/audios/sombrero-aplaudiendo.mp3",
      titulo: "Pertenecer",
      lado: "derecha",
      estiloRelato: { wght: 400, SEIS: 0 },
      relato: "Ese hombre empieza a darte la validación que no lograste tener de tu familia y te convence de entrar a su <strong>grupo delictivo</strong>, dándote por fin <strong>la sensación de ser alguien</strong>.",
      ilustracion: {
        fija: './assets/web/aplauso-fijo.png',
        animacion: './assets/web/aplauso.webp',
        alt: 'Un hombre con sombrero aplaude',
        posicion: 'despues',
      },
      nudo: {
        id: "nudo-7",
        titulo: "Pertenecer",
        dato: {
          texto: "La ausencia de cariño o validación de los padres es otra de las causas por las que los niños son manipulados para entrar a estos grupos, que llenan ese vacío y les dan un lugar al cual pertenecer.",
          contexto: {cifra: "Dinero y afecto", texto: "es lo que buscan muchos adolescentes reclutados en estados como Quintana Roo, según el estudio de Reinserta."},
          fuente: fuentesPorId.escena7,
        },
      },
    },
    {
      id: "escena-8",
      sonido: "./assets/audios/ninos-armas-corto.mp3",
      titulo: "Códigos",
      lado: "izquierda",
      estiloRelato: { wght: 400, SEIS: 100 },
      relato: "Te entrenan para <strong>matar</strong>, pero bajo ciertos códigos. Tu determinación de valer algo en el grupo es tan grande que el hombre que te reclutó te reconoce como uno de los mejores, teniendo solo <strong>12 años</strong>.",
      ilustracion: {
        fija: './assets/web/pistola-fijo.png',
        animacion: './assets/web/pistola.webp',
        alt: 'Una pistola dibujada a mano',
        posicion: 'despues',
      },
      nudo: {
        id: "nudo-8",
        titulo: "Códigos",
        dato: {
          texto: "Dependiendo del grupo delictivo, les enseñan códigos como no matar a niños, a mujeres embarazadas ni a personas que “no la deben”. Un niño sicario puede llegar a cometer entre 80 y 200 homicidios.",
          contexto: {cifra: "7 de cada 10", texto: "adolescentes reclutados que están en internamiento pasaron por un adiestramiento formal dentro del grupo criminal."},
          visual: "pictograma",
          visualDatos: {total: 10, marcados: 7},
          fuente: fuentesPorId.escena8,
        },
      },
    },
    {
      id: "escena-9",
      titulo: "La edad del reclutamiento",
      lado: "derecha",
      estiloRelato: { wght: 400, SEIS: 100 },
      relato: "En una misión, la policía te atrapa y te dan una sentencia que te hace recapacitar sobre cómo quieres seguir <u>tu vida</u>…",
      nudoGrande: true, // El dibujo completo procede del primer fotograma de deshacer-nudo.gif.
      ilustracion: { fija: './assets/web/nudo-final.png', alt: 'Una madeja de hilo enredado', posicion: 'nudo' },
      nudo: {
        id: "nudo-9",
        sonidoDeshacer: "./assets/audios/guardia.mp3",
        imagen: './assets/web/nudo-final.png',
        marcaImagen: { x: 0.49, y: 0.053 },
        titulo: "La edad del reclutamiento",
      },
    },
  ];

  return escenas.map(({ nudo, ...escena }) => ({
    ...escena,
    hilo: escena.id === 'escena-8' ? {
      ...hiloOrfanato,
      salida: { ...hiloOrfanato.entrada, desvio: true },
    } : hiloOrfanato,
    nudo: {
      ...nudoOrfanato,
      ...nudo,
      encuadre: { id: 'deshacer-nudo', espejo: escena.lado === 'izquierda' },
    },
  }));
})();


const EQUIPO = ['Valeria Victoria Moreno San Luis', 'Paula Carolina Sánchez Martínez', 'Sherdi Sebastián Espinosa Bazet'];

CONTENIDO.FINAL = {
  minimo: 145000,
  maximo: 250000,
  porPunto: 100,
  textos: [
    'Esta fue una historia.',
    'REDIM estima que entre {minimo} y {maximo} niñas, niños y adolescentes están en riesgo de ser reclutados por el crimen organizado.',
    'Cada punto representa a {porPunto} de ellos. Los puntos borrosos son los que nadie ha podido contar.',
  ],
  descripcion: 'Entre {minimo} y {maximo} infancias en riesgo. {solidos} puntos sólidos representan el mínimo estimado y {difusos} puntos borrosos, la estimación incierta. Cada punto representa a {porPunto} infancias.',
  leyenda: ['Punto sólido = {porPunto} infancias', 'Punto borroso = estimación incierta'],
  continuar: 'Continuar',
  pantallas: [
    {
      parrafos: [
        'Ningún niño debería tener que sobrevivir a una infancia que nunca tuvo oportunidad de elegir.',
        'Antes de juzgar en quién se convirtió, vale la pena preguntarnos qué tuvo que vivir para llegar hasta ahí.',
      ],
    },
    {
      parrafos: [
        'Organizaciones como Reinserta trabajan para brindarles acompañamiento, herramientas y oportunidades de reinserción.',
        'Porque su pasado no debería determinar todas las posibilidades de su futuro.',
      ],
      logo: './assets/svgs/reinserta.svg',
      marca: 'Reinserta',
      etiquetaLogo: 'Reinserta, abre en una pestaña nueva',
      enlace: { nombre: 'Conoce Reinserta ↗', url: 'https://reinserta.org' },
    },
  ],
  ayudaTeclado: '← → para caminar · ↑ para saltar',
  textura: './assets/web/grano-superior.jpg',
  hilo: './assets/web/hilo-entrada-orfanato.svg',
  imagen: {
    // PROVISIONAL: ilustraciones de portada con hilo recto, hasta contar con final-ninos.png.
    nino: './assets/Imgs/nin%CC%83o.PNG',
    nina: './assets/Imgs/nin%CC%83a.PNG',
    alt: 'Un niño y una niña sostienen un hilo sin nudos.',
  },
  tituloFuentes: 'Ver fuentes',
  tituloDatos: 'Datos',
  historia: {
    etiqueta: 'Historia',
    nombre: 'Los Niños del Narco',
    detalle: 'Sonoro | Rainbow Lobster, 2024',
    url: 'https://podcasts.apple.com/mx/podcast/los-ni%C3%B1os-del-narco/id1746146705',
  },
  proceso: {
    nombre: 'Conoce nuestro proceso y otras fuentes consultadas ↗',
    url: 'https://www.figma.com/board/eo1dbKDHwhMUu1g4RZ86Oc/Infograf%C3%ADa_Isra?node-id=0-1&t=SbODGJhJG38itQHQ-1',
    etiqueta: 'Proceso del proyecto en Figma, abre en una pestaña nueva',
  },
  verCreditos: 'Ver créditos',
  saltarCreditos: 'Saltar créditos',
  tituloCreditos: 'Créditos',
  creditos: [
    { imagen: './assets/textos_infografia/titulo.svg', alt: 'Infancias olvidadas' },
    {
      etiqueta: 'Un proyecto de',
      lineas: EQUIPO,
    },
    {
      etiqueta: 'Relato adaptado de la historia de Tacita',
      lineas: ['Podcast “Los Niños del Narco”', 'Sonoro | Rainbow Lobster, 2024'],
    },
    { etiqueta: 'Investigación y small data', lineas: EQUIPO },
    {
      etiqueta: 'Taller de Visualización de Datos e Información',
      lineas: ['Profesor Israel Aldana Molina', '2026'],
    },
  ],
  volver: { nombre: 'Volver a empezar', url: './index.html' },
};

// Cada estado puede tener { archivos: ['ruta/al/cuadro.png', ...], fps: 10 }.
// Usa PNG del mismo tamaño, con los pies alineados con la base del lienzo.
const PERSONAJE = {
  silueta: { alto: 1652, arriba: 8, suela: 1624 },
  cuadros: {
    caminando: {
      archivos: Array.from({ length: 6 }, (_, i) => `./assets/Imgs/nino/caminar-0${i + 1}.png`),
      fps: 8,
    },
  },
};
