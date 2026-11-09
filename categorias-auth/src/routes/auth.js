const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const db = require('../db');
const { soloInvitados, requireAuth } = require('../middleware/auth');
const { validarRegistro, EMAIL_RE } = require('../validators');

const router = express.Router();

// Maximo 10 intentos de login/registro por IP cada 15 minutos.
const limitador = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).render('error', { titulo: 'Demasiados intentos', mensaje: 'Espera unos minutos antes de intentarlo de nuevo.' })
});

// Hash falso para comparar siempre, aunque el usuario no exista (evita revelar si el correo esta registrado por tiempos de respuesta).
const HASH_FALSO = bcrypt.hashSync('contrasena-falsa-123', 12);

router.get('/registro', soloInvitados, (req, res) => {
  res.render('registro', { errores: {}, valores: {} });
});

router.post('/registro', soloInvitados, limitador, async (req, res) => {
  const nombre = String(req.body.nombre || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const confirmar = String(req.body.confirmar || '');

  const errores = validarRegistro({ nombre, email, password, confirmar });

  if (!errores.email && db.prepare('SELECT 1 FROM usuarios WHERE email = ?').get(email)) {
    errores.email = 'Ya existe una cuenta con ese correo.';
  }

  if (Object.keys(errores).length) {
    return res.status(400).render('registro', { errores, valores: { nombre, email } });
  }

  const hash = await bcrypt.hash(password, 12);
  try {
    db.prepare('INSERT INTO usuarios (nombre, email, password_hash) VALUES (?, ?, ?)').run(nombre, email, hash);
  } catch (e) {
    // Carrera: otro registro con el mismo correo justo antes.
    if (String(e.code).startsWith('SQLITE_CONSTRAINT')) {
      return res.status(400).render('registro', { errores: { email: 'Ya existe una cuenta con ese correo.' }, valores: { nombre, email } });
    }
    throw e;
  }

  req.session.flash = { tipo: 'ok', texto: 'Cuenta creada. Ya puedes iniciar sesión.' };
  res.redirect('/login');
});

router.get('/login', soloInvitados, (req, res) => {
  res.render('login', { error: null, valores: {} });
});

router.post('/login', soloInvitados, limitador, async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!email || !password) {
    return res.status(400).render('login', { error: 'Escribe tu correo y tu contraseña.', valores: { email } });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).render('login', { error: 'Escribe un correo válido.', valores: { email } });
  }

  const usuario = db.prepare('SELECT id, nombre, email, password_hash FROM usuarios WHERE email = ?').get(email);
  const ok = await bcrypt.compare(password, usuario ? usuario.password_hash : HASH_FALSO);

  if (!usuario || !ok) {
    // Mensaje generico: no dice si fallo el correo o la contrasena.
    return res.status(401).render('login', { error: 'Correo o contraseña incorrectos.', valores: { email } });
  }

  // Regenerar la sesion al iniciar sesion previene fijacion de sesion.
  req.session.regenerate((err) => {
    if (err) throw err;
    req.session.usuario = { id: usuario.id, nombre: usuario.nombre, email: usuario.email };
    req.session.flash = { tipo: 'ok', texto: `Bienvenido, ${usuario.nombre}.` };
    res.redirect('/categorias');
  });
});

router.post('/logout', requireAuth, (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('sid');
    res.redirect('/login');
  });
});

module.exports = router;
