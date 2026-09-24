/* =========================================================================
   SITE DATA — edit this file to update your personal info and projects.
   Everything on the site (header, footer, home, project pages) reads from here.
   ========================================================================= */

window.SITE = {
  name: 'Luca Hauspie',
  role: ['Digital designer', '& art direction'],
  location: 'Belgium',
  timezone: 'Europe/Brussels',
  email: 'hello@lucahauspie.be', // TODO: replace with your real address
  availability: 'Open for internships & freelance — 2026',
  socials: [
    { label: 'Instagram', url: 'https://instagram.com/' }, // TODO
    { label: 'Behance', url: 'https://behance.net/' },     // TODO
    { label: 'LinkedIn', url: 'https://linkedin.com/' },   // TODO
  ],
};

/* Projects -----------------------------------------------------------------
   - slug:    used in the URL → project.html?p=<slug>
   - color:   background accent for the project; ink: text colour on top of it
   - cover:   main image (drop your own file in assets/projects/<slug>/ and change the path)
   - gallery: list of images for the case page. Leave empty to show placeholder frames.
              Each item can be a string (path) or { src, wide: true } for full-width.
   ------------------------------------------------------------------------- */
window.PROJECTS = [
  {
    slug: 'gabber-unleashed',
    title: 'Gabber Unleashed',
    lines: ['GABBER', 'UNLEASHED'],
    year: '2025',
    tags: ['Identity', 'Poster', 'Motion'],
    context: 'School project — Howest',
    role: 'Concept, design & motion',
    color: '#E2401C',
    ink: '#0E0E0E',
    cover: 'assets/projects/gabber-unleashed/cover.svg',
    intro:
      'Placeholder — write a short, punchy intro about Gabber Unleashed here. What was the brief, what did you make, and why does it hit at 180 BPM?',
    body:
      'Placeholder — describe the process: research, concept, typography choices, the system you built and the final deliverables.',
    gallery: [],
  },
  {
    slug: 'juke-kickstarter',
    title: 'Juke Kickstarter',
    lines: ['JUKE', 'KICKSTARTER'],
    year: '2025',
    tags: ['Campaign', 'Branding', 'Digital'],
    context: 'School project — Howest',
    role: 'Campaign & visual identity',
    color: '#F2EFE9',
    ink: '#0E0E0E',
    cover: 'assets/projects/juke-kickstarter/cover.svg',
    intro:
      'Placeholder — write a short intro about the Juke Kickstarter campaign here. What was being funded and how did the campaign tell its story?',
    body:
      'Placeholder — describe the campaign strategy, the visual language, the video / social assets and the result.',
    gallery: [],
  },
  {
    slug: 'type01-conference',
    title: 'Type01 Conference',
    lines: ['TYPE01', 'CONFERENCE'],
    year: '2024',
    tags: ['Typography', 'Identity', 'Editorial'],
    context: 'School project — Howest',
    role: 'Identity & editorial design',
    color: '#0E0E0E',
    ink: '#F2EFE9',
    cover: 'assets/projects/type01-conference/cover.svg',
    intro:
      'Placeholder — write a short intro about the Type01 Conference identity here. Who is the audience and what makes the system typographic at its core?',
    body:
      'Placeholder — describe the grid, the type pairing, the signage / programme / badges and how the identity scales.',
    gallery: [],
  },
  {
    slug: 'myst',
    title: 'Myst',
    lines: ['MYST'],
    year: '2024',
    tags: ['Art direction', 'Visual identity'],
    context: 'School project — Howest',
    role: 'Art direction & design',
    color: '#9C9591',
    ink: '#0E0E0E',
    cover: 'assets/projects/myst/cover.svg',
    intro:
      'Placeholder — write a short intro about MYST here. Set the mood: what is it, and what should people feel when they see it?',
    body:
      'Placeholder — describe the art direction, photography / imagery, colour and texture decisions and the final outcome.',
    gallery: [],
  },
];
