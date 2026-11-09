// Pide confirmacion antes de eliminar (archivo externo por la politica CSP).
document.querySelectorAll('form[data-confirmar]').forEach((f) => {
  f.addEventListener('submit', (e) => {
    if (!window.confirm(f.dataset.confirmar)) e.preventDefault();
  });
});
