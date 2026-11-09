const crypto = require('crypto');

// Proteccion CSRF sencilla: un token por sesion que viaja en un campo oculto.
function csrf(req, res, next) {
  if (!req.session.csrf) req.session.csrf = crypto.randomBytes(24).toString('hex');
  res.locals.csrfToken = req.session.csrf;

  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const enviado = req.body && req.body._csrf;
    const a = Buffer.from(String(enviado || ''));
    const b = Buffer.from(req.session.csrf);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return res.status(403).render('error', { titulo: 'Solicitud no válida', mensaje: 'El formulario expiró. Vuelve atrás y reinténtalo.' });
    }
  }
  next();
}

module.exports = csrf;
