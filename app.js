const ZONAS = [
  { id: 'cuernavaca', nombre: 'Cuernavaca, Mor.', lat: 18.9242, lon: -99.2216 },
  { id: 'emiliano-zapata', nombre: 'Emiliano Zapata, Mor.', lat: 18.8436, lon: -99.1838 },
  { id: 'jiutepec', nombre: 'Jiutepec, Mor.', lat: 18.8813, lon: -99.1773 },
  { id: 'temixco', nombre: 'Temixco, Mor.', lat: 18.8536, lon: -99.2264 },
  { id: 'cdmx', nombre: 'Ciudad de México', lat: 19.4326, lon: -99.1332 },
  { id: 'toluca', nombre: 'Toluca, Edo. Méx.', lat: 19.2826, lon: -99.6557 },
  { id: 'puebla', nombre: 'Puebla, Pue.', lat: 19.0414, lon: -98.2063 },
  { id: 'guadalajara', nombre: 'Guadalajara, Jal.', lat: 20.6597, lon: -103.3496 },
  { id: 'monterrey', nombre: 'Monterrey, N.L.', lat: 25.6866, lon: -100.3161 }
];

const SUCURSALES = [
  { nombre: 'Sucursal Cuernavaca Centro', lat: 18.9218, lon: -99.2349 },
  { nombre: 'Sucursal Emiliano Zapata (UTEZ)', lat: 18.8506, lon: -99.2006 },
  { nombre: 'Sucursal Jiutepec CIVAC', lat: 18.8987, lon: -99.1663 },
  { nombre: 'Sucursal CDMX Coyoacán', lat: 19.3500, lon: -99.1620 },
  { nombre: 'Sucursal Toluca', lat: 19.2890, lon: -99.6530 },
  { nombre: 'Sucursal Puebla Angelópolis', lat: 19.0300, lon: -98.2330 },
  { nombre: 'Sucursal Guadalajara', lat: 20.6740, lon: -103.3870 },
  { nombre: 'Sucursal Monterrey', lat: 25.6714, lon: -100.3090 }
];

let ubicacionAdjunta = null;
const reportes = [];

const $ = (id) => document.getElementById(id);

const ui = {
  form: $('form-reporte'),
  btnAdjuntar: $('btn-adjuntar'),
  tarjetaPrePermiso: $('tarjeta-prepermiso'),
  btnConfirmar: $('btn-confirmar-ubicacion'),
  btnPrefieroManual: $('btn-prefiero-manual'),
  cargando: $('estado-cargando'),
  textoCargando: $('texto-cargando'),
  error: $('mensaje-error'),
  ayudaDenegado: $('ayuda-permiso-denegado'),
  resultado: $('resultado-ubicacion'),
  insignia: $('insignia-precision'),
  latitud: $('dato-latitud'),
  longitud: $('dato-longitud'),
  precision: $('dato-precision'),
  hora: $('dato-hora'),
  barra: $('barra-relleno'),
  explicacion: $('explicacion-precision'),
  enlaceMapa: $('enlace-mapa'),
  selectorManual: $('selector-manual'),
  selectZona: $('select-zona'),
  direccionManual: $('direccion-manual'),
  sucursal: $('sucursal-cercana'),
  listaReportes: $('lista-reportes'),
  sinReportes: $('sin-reportes')
};

function mostrar(elemento) { elemento.hidden = false; }
function ocultar(elemento) { elemento.hidden = true; }

function mostrarCargando(texto) {
  ui.textoCargando.textContent = texto || 'Cargando...';
  mostrar(ui.cargando);
  ui.btnAdjuntar.disabled = true;
  ui.btnConfirmar.disabled = true;
}

function ocultarCargando() {
  ocultar(ui.cargando);
  ui.btnAdjuntar.disabled = false;
  ui.btnConfirmar.disabled = false;
}

function mostrarMensajeError(mensaje) {
  ui.error.textContent = '⚠️ ' + mensaje;
  mostrar(ui.error);
}

function limpiarMensajes() {
  ocultar(ui.error);
  ocultar(ui.tarjetaPrePermiso);
  ocultar(ui.ayudaDenegado);
}

function habilitarSelectorManualZona() {
  mostrar(ui.selectorManual);
  ui.selectZona.focus();
}

function renderizarResultadoUbicacion(ubicacion) {
  const calidad = clasificarPrecision(ubicacion.precisionMetros);

  ui.latitud.textContent = ubicacion.latitud.toFixed(6);
  ui.longitud.textContent = ubicacion.longitud.toFixed(6);
  ui.precision.textContent = '± ' + ubicacion.precisionMetros.toLocaleString('es-MX') + ' m';
  ui.hora.textContent = new Date(ubicacion.timestamp).toLocaleString('es-MX');

  ui.insignia.textContent = calidad.etiqueta;
  ui.insignia.className = 'insignia insignia-' + calidad.nivel;

  const porcentaje = Math.max(
    5,
    Math.min(100, 100 - (Math.log10(Math.max(1, ubicacion.precisionMetros)) / 4) * 100)
  );
  ui.barra.style.width = porcentaje + '%';
  ui.barra.className = 'relleno-' + calidad.nivel;

  ui.explicacion.textContent = calidad.nivel === 'alta'
    ? 'Margen de error menor a 30 m: la lectura proviene muy probablemente del chip GPS/GNSS del dispositivo.'
    : 'Margen de error de 30 m o más: la lectura proviene de triangulación Wi-Fi, red celular o dirección IP (típico en laptops y escritorio).';

  ui.enlaceMapa.href =
    'https://www.openstreetmap.org/?mlat=' + ubicacion.latitud +
    '&mlon=' + ubicacion.longitud + '#map=16/' + ubicacion.latitud + '/' + ubicacion.longitud;

  mostrar(ui.resultado);
}

function renderizarSucursalCercana(lat, lon, origen) {
  const masCercana = SUCURSALES
    .map((s) => Object.assign({}, s, { distanciaKm: calcularDistanciaKm(lat, lon, s.lat, s.lon) }))
    .sort((a, b) => a.distanciaKm - b.distanciaKm)[0];

  ui.sucursal.innerHTML = '';
  const titulo = document.createElement('strong');
  titulo.textContent = '🏢 Sucursal más cercana: ' + masCercana.nombre;
  const detalle = document.createElement('div');
  detalle.className = 'texto-pequeno';
  detalle.textContent = 'A ' + masCercana.distanciaKm.toFixed(1) + ' km (calculado desde ' + origen + ').';
  ui.sucursal.appendChild(titulo);
  ui.sucursal.appendChild(detalle);
  mostrar(ui.sucursal);
}

function enviarReporteConUbicacion(datosFormulario) {
  limpiarMensajes();
  mostrarCargando('Obteniendo coordenadas...');

  return obtenerUbicacionActual({ enableHighAccuracy: true, timeout: 7000 })
    .then((ubicacion) => {
      const paqueteCompleto = Object.assign({}, datosFormulario, { coordenadas: ubicacion });
      console.log('Paquete listo para enviar o encolar en IndexedDB:', paqueteCompleto);

      ubicacionAdjunta = Object.assign({ origen: 'gps' }, ubicacion);
      ocultar(ui.selectorManual);
      renderizarResultadoUbicacion(ubicacion);
      return buscarSucursalesCercanas(ubicacion);
    })
    .catch((error) => {
      console.warn('[Geo] Fallback activado:', error.message);
      ocultar(ui.resultado);
      mostrarMensajeError(error.message);
      if (error.code === 1) mostrar(ui.ayudaDenegado);
      habilitarSelectorManualZona();
      actualizarDiagnosticoPermiso();
    })
    .then(() => ocultarCargando());
}

function buscarSucursalesCercanas(ubicacionPrevia) {
  const lectura = ubicacionPrevia
    ? Promise.resolve(ubicacionPrevia)
    : obtenerUbicacionActual({ enableHighAccuracy: false, maximumAge: 60000 });

  return lectura.then((ubicacion) => {
    console.log(`Filtrando sucursales cerca de ${ubicacion.latitud}, ${ubicacion.longitud}`);
    renderizarSucursalCercana(ubicacion.latitud, ubicacion.longitud, 'tu ubicación');
  });
}

function obtenerDatosFormulario() {
  return {
    titulo: $('titulo').value.trim(),
    descripcion: $('descripcion').value.trim()
  };
}

function alPulsarAdjuntar() {
  limpiarMensajes();

  consultarEstadoPermisoGeo().then((estado) => {
    actualizarTextoPermiso(estado);

    if (estado === 'granted') {
      enviarReporteConUbicacion(obtenerDatosFormulario());
    } else if (estado === 'prompt') {
      mostrar(ui.tarjetaPrePermiso);
      ui.btnConfirmar.focus();
    } else {
      mostrar(ui.ayudaDenegado);
      habilitarSelectorManualZona();
    }
  });
}

function alConfirmarUbicacion() {
  ocultar(ui.tarjetaPrePermiso);
  enviarReporteConUbicacion(obtenerDatosFormulario());
}

function alPreferirManual() {
  ocultar(ui.tarjetaPrePermiso);
  habilitarSelectorManualZona();
}

function alCambiarZona() {
  const zona = ZONAS.find((z) => z.id === ui.selectZona.value);
  if (!zona) {
    ocultar(ui.sucursal);
    return;
  }
  ubicacionAdjunta = {
    origen: 'manual',
    zona: zona.nombre,
    latitud: zona.lat,
    longitud: zona.lon
  };
  ocultar(ui.resultado);
  renderizarSucursalCercana(zona.lat, zona.lon, 'la zona ' + zona.nombre);
}

function alEnviarReporte(evento) {
  evento.preventDefault();
  const datos = obtenerDatosFormulario();

  if (!datos.titulo) {
    mostrarMensajeError('Escribe un título para el reporte.');
    $('titulo').focus();
    return;
  }

  if (ubicacionAdjunta && ubicacionAdjunta.origen === 'manual') {
    ubicacionAdjunta.direccion = ui.direccionManual.value.trim();
  }

  const reporte = Object.assign({}, datos, {
    id: Date.now(),
    ubicacion: ubicacionAdjunta
  });
  reportes.unshift(reporte);
  console.log('Reporte enviado:', reporte);
  renderizarReportes();
  reiniciarFormulario();
}

function describirUbicacion(ubicacion) {
  if (!ubicacion) return 'Sin ubicación adjunta';
  if (ubicacion.origen === 'manual') {
    return '📌 Zona manual: ' + ubicacion.zona + (ubicacion.direccion ? ' — ' + ubicacion.direccion : '');
  }
  const calidad = clasificarPrecision(ubicacion.precisionMetros);
  return '📍 ' + ubicacion.latitud.toFixed(5) + ', ' + ubicacion.longitud.toFixed(5) +
    ' (± ' + ubicacion.precisionMetros + ' m · ' + calidad.etiqueta + ')';
}

function renderizarReportes() {
  ui.listaReportes.innerHTML = '';
  reportes.forEach((r) => {
    const li = document.createElement('li');
    const titulo = document.createElement('strong');
    titulo.textContent = r.titulo;
    const ubic = document.createElement('div');
    ubic.className = 'texto-pequeno';
    ubic.textContent = describirUbicacion(r.ubicacion);
    li.appendChild(titulo);
    if (r.descripcion) {
      const desc = document.createElement('div');
      desc.textContent = r.descripcion;
      li.appendChild(desc);
    }
    li.appendChild(ubic);
    ui.listaReportes.appendChild(li);
  });
  ui.sinReportes.hidden = reportes.length > 0;
}

function reiniciarFormulario() {
  ui.form.reset();
  ubicacionAdjunta = null;
  limpiarMensajes();
  ocultar(ui.resultado);
  ocultar(ui.selectorManual);
  ocultar(ui.sucursal);
}

const TEXTO_PERMISO = {
  granted: '✅ Otorgado (granted)',
  prompt: '❔ Sin decidir (prompt)',
  denied: '⛔ Bloqueado (denied)'
};

function actualizarTextoPermiso(estado) {
  $('diag-permiso').textContent = TEXTO_PERMISO[estado] || estado;
}

function actualizarDiagnosticoPermiso() {
  return consultarEstadoPermisoGeo().then(actualizarTextoPermiso);
}

function detectarPlataforma() {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    return 'ios';
  }
  if (/Android/i.test(ua)) return 'android';
  return 'escritorio';
}

function renderizarDiagnostico() {
  $('diag-https').textContent = window.isSecureContext ? '✅ Sí' : '⛔ No (la geolocalización requiere HTTPS)';
  $('diag-geo').textContent = 'geolocation' in navigator ? '✅ Disponible' : '⛔ No soportada';
  $('diag-sw').textContent = 'serviceWorker' in navigator ? 'Registrando...' : '⛔ No soportado';

  const plataforma = detectarPlataforma();
  const consejos = {
    ios: 'iPhone / iPad: la ubicación solo se solicita tras tu toque. Recuerda que Safari y la PWA instalada en inicio manejan permisos por separado.',
    android: 'Android: puedes elegir ubicación "Precisa" o "Aproximada". Con GPS activo en exteriores la precisión suele ser de 3–15 m.',
    escritorio: 'Equipo sin GPS: la ubicación depende de Wi-Fi (30–300 m) o de tu IP (1–10 km). Es normal ver "Ubicación Aproximada".'
  };
  const nombres = { ios: '🍎 iOS', android: '🤖 Android', escritorio: '💻 Escritorio / Laptop' };
  $('diag-plataforma').textContent = nombres[plataforma];
  $('diag-consejo').textContent = consejos[plataforma];

  actualizarDiagnosticoPermiso();

  if ('permissions' in navigator && navigator.permissions.query) {
    navigator.permissions.query({ name: 'geolocation' })
      .then((status) => {
        status.onchange = () => actualizarTextoPermiso(status.state);
      })
      .catch(() => {});
  }
}

function registrarServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('./sw.js')
    .then((registro) => {
      console.log('[SW] Registrado con scope:', registro.scope);
      $('diag-sw').textContent = '✅ Activo (App Shell en caché)';
    })
    .catch((error) => {
      console.error('[SW] Error al registrar:', error);
      $('diag-sw').textContent = '⛔ Error al registrar';
    });
}

function poblarZonas() {
  ZONAS.forEach((zona) => {
    const opcion = document.createElement('option');
    opcion.value = zona.id;
    opcion.textContent = zona.nombre;
    ui.selectZona.appendChild(opcion);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  poblarZonas();
  renderizarDiagnostico();
  registrarServiceWorker();

  ui.btnAdjuntar.addEventListener('click', alPulsarAdjuntar);
  ui.btnConfirmar.addEventListener('click', alConfirmarUbicacion);
  ui.btnPrefieroManual.addEventListener('click', alPreferirManual);
  ui.selectZona.addEventListener('change', alCambiarZona);
  ui.form.addEventListener('submit', alEnviarReporte);
});
