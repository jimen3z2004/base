const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { validarCategoria } = require('../validators');

const router = express.Router();
router.use(requireAuth);

const limpiar = (body) => ({
  nombre: String(body.nombre || '').trim(),
  descripcion: String(body.descripcion || '').trim()
});

// Busca una categoria SOLO si pertenece al usuario con sesion.
function buscarPropia(req) {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) return null;
  return db.prepare('SELECT * FROM categorias WHERE id = ? AND usuario_id = ?').get(id, req.session.usuario.id);
}

const nombreRepetido = (usuarioId, nombre, excluirId = 0) =>
  db.prepare('SELECT 1 FROM categorias WHERE usuario_id = ? AND lower(nombre) = lower(?) AND id != ?').get(usuarioId, nombre, excluirId);

// READ: listado
router.get('/', (req, res) => {
  const categorias = db.prepare('SELECT * FROM categorias WHERE usuario_id = ? ORDER BY id DESC').all(req.session.usuario.id);
  res.render('categorias/index', { categorias });
});

// CREATE
router.get('/nueva', (req, res) => {
  res.render('categorias/form', { titulo: 'Nueva categoría', accion: '/categorias', errores: {}, valores: {} });
});

router.post('/', (req, res) => {
  const valores = limpiar(req.body);
  const errores = validarCategoria(valores);
  if (!errores.nombre && nombreRepetido(req.session.usuario.id, valores.nombre)) errores.nombre = 'Ya tienes una categoría con ese nombre.';
  if (Object.keys(errores).length) {
    return res.status(400).render('categorias/form', { titulo: 'Nueva categoría', accion: '/categorias', errores, valores });
  }
  db.prepare('INSERT INTO categorias (nombre, descripcion, usuario_id) VALUES (?, ?, ?)').run(valores.nombre, valores.descripcion, req.session.usuario.id);
  req.session.flash = { tipo: 'ok', texto: 'Categoría creada.' };
  res.redirect('/categorias');
});

// UPDATE
router.get('/:id/editar', (req, res) => {
  const cat = buscarPropia(req);
  if (!cat) return res.status(404).render('error', { titulo: 'No encontrada', mensaje: 'Esa categoría no existe o no es tuya.' });
  res.render('categorias/form', { titulo: 'Editar categoría', accion: `/categorias/${cat.id}/actualizar`, errores: {}, valores: cat });
});

router.post('/:id/actualizar', (req, res) => {
  const cat = buscarPropia(req);
  if (!cat) return res.status(404).render('error', { titulo: 'No encontrada', mensaje: 'Esa categoría no existe o no es tuya.' });
  const valores = limpiar(req.body);
  const errores = validarCategoria(valores);
  if (!errores.nombre && nombreRepetido(req.session.usuario.id, valores.nombre, cat.id)) errores.nombre = 'Ya tienes una categoría con ese nombre.';
  if (Object.keys(errores).length) {
    return res.status(400).render('categorias/form', { titulo: 'Editar categoría', accion: `/categorias/${cat.id}/actualizar`, errores, valores });
  }
  db.prepare('UPDATE categorias SET nombre = ?, descripcion = ? WHERE id = ?').run(valores.nombre, valores.descripcion, cat.id);
  req.session.flash = { tipo: 'ok', texto: 'Categoría actualizada.' };
  res.redirect('/categorias');
});

// DELETE
router.post('/:id/eliminar', (req, res) => {
  const cat = buscarPropia(req);
  if (!cat) return res.status(404).render('error', { titulo: 'No encontrada', mensaje: 'Esa categoría no existe o no es tuya.' });
  db.prepare('DELETE FROM categorias WHERE id = ?').run(cat.id);
  req.session.flash = { tipo: 'ok', texto: 'Categoría eliminada.' };
  res.redirect('/categorias');
});

module.exports = router;
