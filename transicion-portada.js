(() => {
  const raiz = document.documentElement;
  const reducir = matchMedia('(prefers-reduced-motion: reduce)');
  const empezar = document.querySelector('.empezar');

  if (empezar) {
    empezar.addEventListener('click', evento => {
      if (reducir.matches || evento.button !== 0 || evento.metaKey || evento.altKey ||
        evento.ctrlKey || evento.shiftKey) return;
      evento.preventDefault();
      if (raiz.classList.contains('saliendo-portada')) return;
      const destino = new URL(empezar.href);
      destino.searchParams.set('entrada', 'portada');
      raiz.classList.add('saliendo-portada');
      setTimeout(() => location.assign(destino.href), 400);
    });
    window.addEventListener('pageshow', () => raiz.classList.remove('saliendo-portada'));
    return;
  }

  const actual = new URL(location.href);
  if (actual.searchParams.get('entrada') !== 'portada') return;
  actual.searchParams.delete('entrada');
  try { history.replaceState(history.state, '', actual.href); } catch { /* file:// conserva la URL si el navegador lo requiere. */ }
  requestAnimationFrame(() => requestAnimationFrame(() => raiz.classList.remove('entrada-desde-portada')));
})();
