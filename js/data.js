/* =========================================================================
   SITE DATA — edit this file to update your personal info and projects.
   Everything on the site (header, footer, home, project pages) reads from here.
   ========================================================================= */

window.SITE = {
  name: 'Luca Hauspie',
  role: ['Digital designer', '& creative developer'],
  location: 'Belgium',
  email: 'lucahauspie@gmail.com', // TODO: replace with your real address
  availability: 'Open for internships and freelance in 2026/2027',
  socials: [
    { label: 'Instagram', url: 'https://www.instagram.com/luca.gfxdesign/' },
  ],
};

/* Text on the site ---------------------------------------------------------
   All fixed text of the home page, the footer and the project pages.
   You can use <br> for a line break and <em>word</em> for the red italic word in the statement.
   {count} = number of projects (05), {countWord} = the same in words (five), {archive} = number of archive posters.
   ------------------------------------------------------------------------- */
window.TEXT = {
  // home: small texts at the top of the hero
  heroLeft: '(Portfolio)<br>Selected works ©2024-2026',
  heroRight: '(Hover a project)',
  scroll: 'Scroll ↓',

  // home: works list
  worksTitle: '(Works)',
  worksSide: '({count}) School projects<br>©2024-2026',
  viewCase: 'View case', // label that follows the cursor over a project

  // home: the statement block
  statementLabel: '(Hi, I’m Luca)',
  statement: 'I design <em>loud</em> identities {img1} experimental type {img2} &amp; things that <em>move</em>. Graphic design with the volume turned up.',
  statementButton: 'More about me',

  // footer (every page)
  footerKickerLeft: '(Got a project?)',
  footerKickerRight: '(Let’s make it loud)',
  footerBig: 'Let’s talk',
  footerRights: 'All rights reserved',
  footerTime: 'Local time',
  backToTop: 'Back to top ↑',

  // project pages
  visitLive: 'Visit live site',
  liveWebsiteNote: '(Live website, designed for {size}. Scroll inside.)',
  openWebsite: 'Open the website',
  screensNote: '(Scroll inside the screens)',
  watchFilm: 'Watch the full video',
  filmLabel: '(Full video)',
  filmSound: 'Sound on ♪',
  conceptLabel: '(The concept)',
  processTitle: 'Process', // big title above every project's process
  questionLabel: '(The question)',
  challengeLabel: '(Biggest challenge)',
  learnedLabel: '(What I’ve learned)',
  todo: 'To be written.',
  nextProject: '(Next project)',

  // archive page
  archiveTitle: 'Archive',
  archiveIntro: 'Posters and cover art I made before I started studying. Self-taught, mostly for bands and for fun.',
  archiveCount: '({archive}) Posters, before school',
  archiveClose: 'Close',

  // contact page title
  contactTitle: 'Say hi!',
};

/* Archive -----------------------------------------------------------------
   Work from before school, shown on archive.html (no detail pages).
   - file: name in assets/archive/ (a smaller copy with the same name lives in assets/archive/thumbs/)
   - title, note: shown under the poster and in the full-size view. Leave note empty if you like.
   ------------------------------------------------------------------------- */
window.ARCHIVE = [
  { file: 'explanation.jpg', title: 'Explanation', note: 'Poster' },
  { file: 'qui-veut-la-facilite.jpg', title: 'Qui veut la facilité?', note: 'Poster' },
  { file: 'fontaines-dc.jpg', title: 'Fontaines D.C.', note: 'Band poster' },
  { file: 'the-luka-state.jpg', title: 'The Luka State', note: 'Tour poster' },
  { file: 'proportions.jpg', title: 'Proportions', note: 'Poster' },
  { file: 'fictional-film.jpg', title: 'A fictional film', note: 'Film poster' },
  { file: 'progress.jpg', title: 'Progress or not understanding sh*t', note: 'Square poster' },
  { file: 'teardrop.jpg', title: 'Teardrop', note: 'Cover art' },
];

/* Projects -----------------------------------------------------------------
   - slug:    used in the URL → project.html?p=<slug>
   - color:   background accent for the project; ink: text colour on top of it
   - accent:  (optional) highlight colour on the project's page, instead of the site orange
   - cover:   main image (drop your own file in assets/projects/<slug>/ and change the path)
   - gallery: list of images for the case page. Leave empty to show placeholder frames.
              Each item can be a string (path) or { src, wide: true } for full-width.
   - preview: (optional) path to a live HTML preview, shown instead of the cover on hover + case page
   - video:   (optional) short muted clip, used the same way as preview
   - film:    (optional) full video with sound + controls on the case page
   - still:   (optional) full-screen image, used as hero the same way as preview / video
   - subtitle: (optional) line that goes with the hero title (projects with an HTML preview have it inside the fold)
   - paragraphs (intro, body, the process question + step texts, biggest challenge, what I've learned)
     live in content/<slug>.md, one Markdown file per project
   - process: (optional) { hmw, team[], weeks[], unit?, step? } — timeline on the case page
              (unit/step rename the counter, e.g. 'steps' / 'Step' instead of 'weeks' / 'Week')
   - url:     (optional) link to the live project
   - screens: (optional) [{ label, desktop, mobile }] full-page screenshots, scrollable, desktop next to mobile
   - site:    (optional) { url, width, height, shot } — live website in a browser frame on the case page,
              always rendered at its design size and scaled to fit; 'shot' (full-page screenshot) is shown on phones
   - previewCursor / previewClick: (optional) cursor label + message sent to the preview when its hero is clicked
   ------------------------------------------------------------------------- */
window.PROJECTS = [
  {
    slug: 'gabber-unleashed',
    title: 'Gabber Unleashed',
    lines: ['GABBER', 'UNLEASHED'],
    year: '2025',
    tags: ['Webdesign', 'Illustration', 'Concept'],
    context: 'School project, Howest (Integration 1)',
    role: 'Concept, illustration, design & development',
    color: '#161616',
    ink: '#FFF4ED',
    cover: 'assets/projects/gabber-unleashed/cover.jpg',
    // hero rebuilt from the 1DEV int1 site (title + gabber breaking his chain)
    preview: 'assets/projects/gabber-unleashed/fold/index.html',
    url: 'https://lucahauspie.be/integration1/',
    // the live site, built for a 1440px screen (13" MacBook): rendered at that size and scaled to fit
    site: { url: 'https://lucahauspie.be/integration1/', width: 1440, height: 900, shot: 'assets/projects/gabber-unleashed/site-home.jpg' },
    // process summarised from the Miro board (1DEV_LucaHauspie_miro)
    process: {
      unit: 'steps',
      step: 'Step',
      weeks: [
        {
          title: 'Research',
          points: ['Target audience', 'Interview', 'Valuable content'],
          imgs: false,
        },
        {
          title: 'Concept',
          points: ['HMW', 'Crazy 8s', 'Tips & tricks', 'Pitch'],
          note: 'The brainstorms are in Dutch',
          imgs: [{ src: 'assets/projects/gabber-unleashed/process/brainstorm-key-values.jpg', wide: true }, 'assets/projects/gabber-unleashed/process/brainstorm-community.jpg', 'assets/projects/gabber-unleashed/process/brainstorm-culture.jpg', { src: 'assets/projects/gabber-unleashed/process/crazy-8.jpg', wide: true }],
        },
        {
          title: 'Style',
          points: ['Styleboard', 'Saul Bass', 'First illustrations'],
          imgs: ['assets/projects/gabber-unleashed/process/styleboard.jpg', 'assets/projects/gabber-unleashed/process/wireframe.jpg'],
        },
        {
          title: 'Concept image',
          points: ['Rejected → redrawn', 'Chains'],
          note: 'First sketch (rejected), mind map (in Dutch), final concept image',
          imgs: ['assets/projects/gabber-unleashed/process/first-sketch.jpg', 'assets/projects/gabber-unleashed/process/concept-image-mindmap.jpg', { src: 'assets/projects/gabber-unleashed/process/hero-grid.jpg', wide: true }],
        },
        {
          title: 'Feedback rounds',
          points: ['Peer-to-peer', 'Consults', 'Alignment'],
          imgs: false,
        },
        {
          title: 'Final',
          points: ['Join us page', 'Accessibility', 'HTML & CSS'],
          imgs: false,
        },
      ],
    },
    gallery: [],
  },
  {
    slug: 'juke-kickstarter',
    subtitle: 'Motion design / Kickstarter campaign', // shown right under the title on the video
    title: 'Juke Snowboards',
    lines: ['JUKE', 'SNOWBOARDS'],
    year: '2025',
    tags: ['Motion design', 'Kickstarter', 'Video'],
    context: 'School project, Howest (Motion design)',
    role: 'Concept, animation & edit',
    color: '#F2EFE9',
    ink: '#0E0E0E',
    accent: '#52B6EE', // numbers, underlines and buttons on this project's page (taken from the design)
    cover: 'assets/projects/juke-kickstarter/cover.jpg',
    // 8s muted cut (0:03–0:11) of the Kickstarter video — plays as hero on hover + case page
    video: 'assets/projects/juke-kickstarter/hero.mp4',
    // the whole video with sound, shown on the case page
    film: 'assets/projects/juke-kickstarter/film.mp4',
    process: {
      unit: 'steps',
      step: 'Step',
      weeks: [
        {
          title: 'The brand',
          points: ['Authenticity', 'Handmade craft', 'Passion over profit', 'Locally made'],
          imgs: false,
        },
        {
          title: 'Style',
          points: ['Styleboard', 'Styleframe'],
          imgs: [{ src: 'assets/projects/juke-kickstarter/process/styleboard.jpg', wide: true }, 'assets/projects/juke-kickstarter/process/styleframe.jpg', 'assets/projects/juke-kickstarter/process/two-friends.jpg'],
        },
        {
          title: 'Script & storyboard',
          points: ['7 scenes', '30 seconds'],
          imgs: [{ src: 'assets/projects/juke-kickstarter/process/storyboard.jpg', wide: true }],
        },
      ],
    },
    gallery: [],
  },
  {
    slug: 'type01-conference',
    title: 'Type01 Conference',
    lines: ['TYPE01', 'CONFERENCE'],
    year: '2024',
    tags: ['Webdesign', 'UI design', 'Typography'],
    context: 'School project, Howest',
    role: 'Responsive webdesign',
    color: '#161616',
    ink: '#BDF640',
    accent: '#B184F5', // numbers, underlines and buttons on this project's page (taken from the design)
    cover: 'assets/projects/type01-conference/cover.jpg',
    // the Type01 hero, rebuilt with the letter assets — letters slowly stretch and float
    preview: 'assets/projects/type01-conference/fold/index.html',
    // final design, page by page: full-page screenshots you scroll through (desktop + mobile side by side)
    screens: [
      { label: '(01) Home', desktop: 'assets/projects/type01-conference/pages/home.jpg', mobile: 'assets/projects/type01-conference/pages/home-mobile.jpg' },
      { label: '(02) Schedule, Friday', desktop: 'assets/projects/type01-conference/pages/schedule-friday.jpg', mobile: 'assets/projects/type01-conference/pages/schedule-friday-mobile.jpg' },
      { label: '(03) Speaker', desktop: 'assets/projects/type01-conference/pages/speaker.jpg', mobile: 'assets/projects/type01-conference/pages/speaker-mobile.jpg' },
      { label: '(04) Schedule, Saturday', desktop: 'assets/projects/type01-conference/pages/schedule-saturday.jpg', mobile: 'assets/projects/type01-conference/pages/schedule-saturday-mobile.jpg' },
    ],
    process: {
      unit: 'steps',
      step: 'Step',
      weeks: [
        { title: 'First tryout', points: ['Wrong message'], imgs: [{ src: 'assets/projects/type01-conference/process/first-tryout.jpg', scroll: true, label: 'Desktop' }, { src: 'assets/projects/type01-conference/process/first-tryout-mobile.jpg', scroll: true, label: 'Mobile' }] },
        { title: 'Research', points: ['Magazines', 'Experimental type'], imgs: ['assets/projects/type01-conference/process/inspiration-editorial.jpg', 'assets/projects/type01-conference/process/inspiration-type.jpg'] },
        { title: 'A new direction', points: ['Styleframe'], imgs: ['assets/projects/type01-conference/process/styleframe-green.jpg'] },
        { title: 'Wireframe & UI research', points: ['Wireframe', 'UI references'], imgs: [{ src: 'assets/projects/type01-conference/process/wireframe.jpg', scroll: true, label: 'Wireframe' }, 'assets/projects/type01-conference/process/ui-research.jpg'] },
        { title: 'Second tryout', points: ['Green + black', 'Needed a third colour'], imgs: [{ src: 'assets/projects/type01-conference/process/second-tryout.jpg', scroll: true, label: 'Second tryout' }] },
        { title: 'Final', points: ['Desktop', 'Phone', 'Auto Layout'], imgs: false },
      ],
    },
    gallery: [],
  },
  {
    slug: 'myst',
    subtitle: 'Installation & app for Visit Antwerp', // bottom left, in MYST's own letterspaced style (css: .live-sub--myst)
    title: 'Myst',
    lines: ['MYST'],
    year: '2026',
    tags: ['Experience design', 'Installation', 'App'],
    context: 'Howest × Rotterdam, brief by Visit Antwerp',
    role: 'Visual design & installation',
    color: '#ECEAE6',
    ink: '#161616',
    accent: '#D42F2F', // numbers, underlines and buttons on this project's page (taken from the design)
    cover: 'assets/projects/myst/cover.jpg',
    // start screen of the INT4 installation, live: animated mist + the original Lottie logo (mystload.json)
    preview: 'assets/projects/myst/fold/index.html',
    // visual for each "## Concept N" part in content/myst.md: { big } (typographic), { img } or { video, poster }
    concept: [
      { big: 'No plans.<br>Side quests.' },
      { video: 'assets/projects/myst/web/installation.mp4', poster: 'assets/projects/myst/web/installation-poster.jpg' },
      { img: 'assets/projects/myst/web/map-fog.jpg' },
    ],
    // end result, shown before the process
    showcase: [
      { label: '(Installation) Pick an outfit on the iPad, it’s projected onto the mannequin', imgs: [{ video: 'assets/projects/myst/web/installation.mp4', poster: 'assets/projects/myst/web/installation-poster.jpg' }, 'assets/projects/myst/web/final-ipad.jpg'] },
      { label: '(App) Onboarding: before the mist clears, who are you?', phone: true, imgs: ['assets/projects/myst/web/onboarding-styles.jpg', 'assets/projects/myst/web/onboarding-interests.jpg'] },
      { label: '(App) The fog map: pins clear the mist', phone: true, imgs: ['assets/projects/myst/web/map-fog.jpg', 'assets/projects/myst/web/map-pin.jpg', 'assets/projects/myst/web/pin-detail.jpg', 'assets/projects/myst/web/add-discovery.jpg'] },
      { label: '(App) Crews & profile', phone: true, imgs: ['assets/projects/myst/web/crews.jpg', 'assets/projects/myst/web/crew-detail.jpg', 'assets/projects/myst/web/crew-code.jpg', 'assets/projects/myst/web/profile.jpg'] },
    ],
    // six-week process, shown as a timeline on the case page.
    // imgs: add paths (e.g. 'assets/projects/myst/process/w1-01.jpg') — empty frames show until then
    process: {
      team: [
        { name: 'Amber Vanhooren', role: 'Experience design, development' },
        { name: 'Luca Hauspie', role: 'Visual design, installation', me: true },
        { name: 'Alexander Jonckheere', role: 'Physical installation, visual design' },
        { name: 'Tjorven Florin', role: 'Development' },
      ],
      weeks: [
        {
          title: 'Research & concept',
          points: ['Co-creation', 'Free choice', 'Unconscious discovery', 'Personality'],
          imgs: false,
        },
        {
          title: 'Refining & validating',
          points: ['Styleboards', 'Survey', 'Personas', 'Hi-fi wireframes'],
          imgs: ['assets/projects/myst/web/inspo.jpg', 'assets/projects/myst/web/styleboard.jpg'],
        },
        {
          title: 'Testing & prototyping',
          points: ['Flowchart', 'MadMapper', '9 fashion styles', 'iPad iterations'],
          note: 'First design: dark and blue-tinted. The final went light, with black and red.',
          imgs: ['assets/projects/myst/web/first-ipad.jpg', 'assets/projects/myst/web/first-story.jpg'],
        },
        {
          title: 'Building the box',
          points: ['Physical build', 'Projection mapping', 'OSC + MadMapper', 'Mobile design'],
          note: 'The iPad app that ran in the box: pick an outfit, read its story, find the store',
          imgs: ['assets/projects/myst/web/ipad-picker.jpg', 'assets/projects/myst/web/ipad-outfit.jpg', 'assets/projects/myst/web/ipad-store.jpg'],
        },
        {
          title: 'Final design & development',
          points: ['Final app', 'iPad kiosk', 'Case movie & promo'],
          imgs: false,
        },
        {
          title: 'Expo',
          points: ['Expo in Kortrijk'],
          imgs: false,
        },
      ],
    },
    gallery: [],
  },
  {
    slug: 'too-wild-to-be-contained',
    title: 'Too Wild To Be Contained',
    lines: ['TOO WILD', 'TO BE', 'CONTAINED'],
    year: '2026',
    tags: ['Interactive storytelling', 'Web', 'Motion'],
    context: 'School project, Howest (Integration 03)',
    role: 'Concept, design & development',
    color: '#FFFFFF',
    ink: '#FF2121',
    accent: '#F8D800', // numbers, underlines and buttons on this project's page (taken from the design)
    cover: 'assets/projects/too-wild-to-be-contained/cover.jpg',
    // live, animated recreation of the site's fold — used instead of the cover where there's room for it
    preview: 'assets/projects/too-wild-to-be-contained/fold/index.html',
    url: 'https://lucahauspie.github.io/integration03/',
    // the live site in a browser frame (end result, shown before the process)
    site: { url: 'https://lucahauspie.github.io/integration03/', width: 1440, height: 900, shot: 'assets/projects/too-wild-to-be-contained/pages/desktop.jpg' },
    previewCursor: 'Click to release',
    previewClick: 'burst',
    process: {
      unit: 'steps',
      step: 'Step',
      weeks: [
        {
          title: 'The story',
          imgs: [{ src: 'assets/projects/too-wild-to-be-contained/process/final-focus.jpg', large: true }],
        },
        {
          title: 'Wireframes',
          points: ['Chapters', 'Puk interactions', 'White → black'],
          imgs: ['assets/projects/too-wild-to-be-contained/process/wireframe-1.jpg', 'assets/projects/too-wild-to-be-contained/process/wireframe-2.jpg', 'assets/projects/too-wild-to-be-contained/process/wireframe-4.jpg', { src: 'assets/projects/too-wild-to-be-contained/process/wireframe-escalation.jpg' }],
        },
        {
          title: 'Styleframe',
          imgs: ['assets/projects/too-wild-to-be-contained/process/styleframe.jpg', { src: 'assets/projects/too-wild-to-be-contained/process/first-design.jpg', scroll: true, label: 'First styled version' }],
        },
        {
          title: 'Iteration',
          points: ['Start production → drag game'],
          imgs: [{ src: 'assets/projects/too-wild-to-be-contained/process/design-v1.jpg', scroll: true, label: 'Earlier: start production', at: 0.27 }, { src: 'assets/projects/too-wild-to-be-contained/pages/desktop.jpg', scroll: true, label: 'Final: drag game', at: 0.3 }],
        },
        {
          title: 'Build',
          points: ['Vite', 'GSAP', 'Lottie'],
          imgs: false,
        },
      ],
    },
    gallery: [],
  },
];
