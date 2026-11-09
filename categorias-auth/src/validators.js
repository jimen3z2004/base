const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validarRegistro({ nombre, email, password, confirmar }) {
  const errores = {};

  if (!nombre || nombre.length < 2) errores.nombre = 'El nombre debe tener al menos 2 caracteres.';
  else if (nombre.length > 60) errores.nombre = 'El nombre no puede superar 60 caracteres.';

  if (!email) errores.email = 'El correo es obligatorio.';
  else if (email.length > 120 || !EMAIL_RE.test(email)) errores.email = 'Escribe un correo válido, por ejemplo nombre@dominio.com.';

  if (!password) errores.password = 'La contraseña es obligatoria.';
  else if (password.length < 8) errores.password = 'La contraseña debe tener al menos 8 caracteres.';
  else if (password.length > 72) errores.password = 'La contraseña no puede superar 72 caracteres.';
  else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) errores.password = 'La contraseña debe incluir al menos una letra y un número.';

  if (!errores.password && password !== confirmar) errores.confirmar = 'Las contraseñas no coinciden.';

  return errores;
}

function validarCategoria({ nombre, descripcion }) {
  const errores = {};
  if (!nombre) errores.nombre = 'El nombre es obligatorio.';
  else if (nombre.length < 2) errores.nombre = 'El nombre debe tener al menos 2 caracteres.';
  else if (nombre.length > 50) errores.nombre = 'El nombre no puede superar 50 caracteres.';
  if (descripcion && descripcion.length > 200) errores.descripcion = 'La descripción no puede superar 200 caracteres.';
  return errores;
}

module.exports = { validarRegistro, validarCategoria, EMAIL_RE };
