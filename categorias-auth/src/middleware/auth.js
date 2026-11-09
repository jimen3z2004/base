// Solo deja pasar a usuarios con sesion iniciada.
function requireAuth(req, res, next) {
  if (!req.session.usuario) {
    req.session.flash = { tipo: 'error', texto: 'Inicia sesión para ver las categorías.' };
    return res.redirect('/login');
  }
  next();
}

// Evita que alguien ya autenticado vea login/registro.
function soloInvitados(req, res, next) {
  if (req.session.usuario) return res.redirect('/categorias');
  next();
}

module.exports = { requireAuth, soloInvitados };
