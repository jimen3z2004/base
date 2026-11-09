const path = require('path');
const express = require('express');
const session = require('express-session');
const SqliteStore = require('better-sqlite3-session-store')(session);
const db = require('./db');
const csrf = require('./middleware/csrf');

const app = express();
const PROD = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3000;

if (PROD && !process.env.SESSION_SECRET) {
  console.error('Falta SESSION_SECRET en produccion.');
  process.exit(1);
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));
app.set('trust proxy', 1); // necesario detras del proxy de Render/Railway para cookies seguras
app.disable('x-powered-by');

app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'same-origin',
    'Content-Security-Policy': "default-src 'self'; style-src 'self'; script-src 'self'; form-action 'self'; frame-ancestors 'none'"
  });
  next();
});

app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

app.use(
  session({
    name: 'sid',
    secret: process.env.SESSION_SECRET || 'solo-para-desarrollo-local',
    resave: false,
    saveUninitialized: false,
    store: new SqliteStore({ client: db, expired: { clear: true, intervalMs: 15 * 60 * 1000 } }),
    cookie: { httpOnly: true, sameSite: 'lax', secure: PROD, maxAge: 1000 * 60 * 60 * 2 }
  })
);

// Variables disponibles en todas las vistas + mensaje flash de un solo uso.
app.use((req, res, next) => {
  res.locals.usuario = req.session.usuario || null;
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  next();
});

app.use(csrf);

app.get('/', (req, res) => res.redirect(req.session.usuario ? '/categorias' : '/login'));
app.use(require('./routes/auth'));
app.use('/categorias', require('./routes/categorias'));

app.use((req, res) => res.status(404).render('error', { titulo: 'Página no encontrada', mensaje: 'La dirección que buscas no existe.' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('error', { titulo: 'Algo salió mal', mensaje: 'Ocurrió un error inesperado. Inténtalo de nuevo.' });
});

app.listen(PORT, () => console.log(`Servidor listo en http://localhost:${PORT}`));
