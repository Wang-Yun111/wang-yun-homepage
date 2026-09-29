const btn = document.querySelector('.menu-btn');
const nav = document.querySelector('.nav-links');
btn?.addEventListener('click', () => nav?.classList.toggle('open'));

document.querySelectorAll('[data-filter]').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
    button.classList.add('active');
    const filter = button.dataset.filter;
    document.querySelectorAll('[data-type]').forEach(item => {
      item.style.display = filter === 'all' || item.dataset.type === filter ? '' : 'none';
    });
  });
});
