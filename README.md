# Wang Yun — Personal Research Space

A monochrome, content-first academic homepage for research, reading notes, projects, service and campus moments.

## Local build

```bash
npm run build
npm run preview
```

Open `http://localhost:4173`. The deployable site is generated in `dist/`.

## Update the site

- Personal links and research themes: `site.config.json`
- Reading / research notes: `content/notes/`
- Projects: `content/projects/`
- Student service and counselor work: `content/service/`
- Photo journals: `content/moments/`
- Images: `public/images/`

After editing, run `npm run build` locally. On Cloudflare Pages, every push can rebuild automatically.

## Cloudflare Pages

- Framework preset: None
- Build command: `npm run build`
- Build output directory: `dist`
- Node.js: 18+

The design stays intentionally black, gray and warm-white, with images rendered in grayscale by CSS.
