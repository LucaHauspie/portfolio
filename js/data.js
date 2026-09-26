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
   - preview: (optional) path to a live HTML preview, shown instead of the cover on hover + case page
   - video:   (optional) short muted clip, used the same way as preview
   - film:    (optional) full video with sound + controls on the case page
   - url:     (optional) link to the live project
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
    tags: ['Motion design', 'Kickstarter', 'Video'],
    context: 'School project — Howest (Motion design)',
    role: 'Concept, animation & edit',
    color: '#F2EFE9',
    ink: '#0E0E0E',
    cover: 'assets/projects/juke-kickstarter/cover.jpg',
    // 8s muted cut (0:03–0:11) of the Kickstarter video — plays as hero on hover + case page
    video: 'assets/projects/juke-kickstarter/hero.mp4',
    // the whole video with sound, shown on the case page
    film: 'assets/projects/juke-kickstarter/film.mp4',
    // small line shown above the big title on top of the video
    kicker: 'Motion design — a Kickstarter video for Juke, handmade snowboards',
    intro:
      'A motion design project: create the video for someone’s Kickstarter campaign. I chose Juke — a brand of handmade snowboards, made by two friends.',
    body:
      'The video tells Juke’s story in bold, flat shapes and big type: snowboards, made by hand, by two friends, locally made — ending on the boards themselves and a call to support the campaign.',
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
  {
    slug: 'too-wild-to-be-contained',
    title: 'Too Wild To Be Contained',
    lines: ['TOO WILD', 'TO BE', 'CONTAINED'],
    year: '2026',
    tags: ['Interactive storytelling', 'Web', 'Motion'],
    context: 'School project — Howest (Integration 03)',
    role: 'Concept, design & development',
    color: '#FFFFFF',
    ink: '#FF2121',
    cover: 'assets/projects/too-wild-to-be-contained/cover.jpg',
    // live, animated recreation of the site's fold — used instead of the cover where there's room for it
    preview: 'assets/projects/too-wild-to-be-contained/fold/index.html',
    url: 'https://lucahauspie.github.io/integration03/',
    intro:
      'An interactive storytelling website about what happened to Wild & Lethal Trash — Walter Van Beirendonck’s most iconic brand, founded in 1993 and too wild for the market that tried to contain it.',
    body:
      'Visitors release the W&LT mascot to start the story, then wake, drag and scroll their way through the label’s rise, its collaboration with Mustang and the breaking point where radical expression collided with large-scale fashion commerce. Built with GSAP, ScrollTrigger, Draggable and Lottie.',
    gallery: [],
  },
];
