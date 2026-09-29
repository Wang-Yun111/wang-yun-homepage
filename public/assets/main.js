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

// Personal homepage enhancements: portrait + public contact links.
const style = document.createElement('style');
style.textContent = `
  .profile-frame{width:min(100%,300px);aspect-ratio:5/7;margin:0 0 30px auto;background:#fbfaf7;border:1px solid #c9c5bc;overflow:hidden}
  .profile-frame img{width:100%;height:100%;display:block;object-fit:cover;object-position:center 34%;filter:grayscale(1) contrast(1.04)}
  @media(max-width:900px){.profile-frame{width:min(72vw,300px);margin:0 0 28px 0}}
`;
document.head.appendChild(style);

const heroSide = document.querySelector('.hero-side');
if (heroSide && !heroSide.querySelector('.profile-frame')) {
  const figure = document.createElement('figure');
  figure.className = 'profile-frame';
  const image = document.createElement('img');
  image.src = '/images/profile.jpg';
  image.alt = 'Portrait of Wang Yun';
  figure.appendChild(image);
  heroSide.prepend(figure);
}

document.querySelectorAll('a').forEach(link => {
  const label = link.textContent.trim();
  if (label === 'Scholar') {
    link.textContent = 'Gmail';
    link.href = 'mailto:wangyunbuaa@gmail.com';
  }
  if (label === 'CV' || label.startsWith('CV ')) {
    link.style.display = 'none';
  }
});
