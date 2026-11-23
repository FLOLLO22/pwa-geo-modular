const UMBRAL_PRECISION_ALTA_METROS = 30;

function traducirErrorGeolocalizacion(error) {
  switch (error.code) {
    case 1:
      return 'Permiso de ubicación denegado. Puedes ingresar tu zona manualmente.';
    case 2:
      return 'No fue posible determinar tu ubicación (señal GPS o Wi-Fi no disponible).';
    case 3:
      return 'Se agotó el tiempo de espera intentando obtener las coordenadas.';
    default:
      return 'Ocurrió un error inesperado al consultar la ubicación.';
  }
}

function obtenerUbicacionActual(opcionesPersonalizadas) {
  const opciones = Object.assign(
    {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 30000
    },
    opcionesPersonalizadas
  );

  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Este navegador no soporta la API de Geolocalización.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        resolve({
          latitud: posicion.coords.latitude,
          longitud: posicion.coords.longitude,
          precisionMetros: Math.round(posicion.coords.accuracy),
          timestamp: posicion.timestamp
        });
      },
      (error) => {
        const errorTraducido = new Error(traducirErrorGeolocalizacion(error));
        errorTraducido.code = error.code;
        reject(errorTraducido);
      },
      opciones
    );
  });
}

function consultarEstadoPermisoGeo() {
  if (!('permissions' in navigator) || !navigator.permissions.query) {
    return Promise.resolve('prompt');
  }

  return navigator.permissions.query({ name: 'geolocation' })
    .then((resultado) => resultado.state)
    .catch(() => 'prompt');
}

function clasificarPrecision(precisionMetros) {
  if (precisionMetros < UMBRAL_PRECISION_ALTA_METROS) {
    return { nivel: 'alta', etiqueta: 'Precisión GPS Alta' };
  }
  return { nivel: 'aproximada', etiqueta: 'Ubicación Aproximada (Wi-Fi / IP)' };
}

function calcularDistanciaKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const rad = (grados) => (grados * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
