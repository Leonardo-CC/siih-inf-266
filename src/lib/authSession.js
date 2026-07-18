// src/lib/authSession.js
const STORAGE_KEY = 'siih_usuario';

export function guardarUsuario(usuario) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(usuario));
}

export function obtenerUsuario() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function cerrarSesion() {
  localStorage.removeItem(STORAGE_KEY);
}
