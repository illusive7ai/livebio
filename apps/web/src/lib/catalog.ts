import { buildContributions, gridFromRgba, type Avatar, type ContributionDay, type Profile } from '@livebio/core';

export type Group = 'Professional' | 'Creative' | 'Developer' | 'Minimal';

/** How the designs are grouped on the Templates page and in the picker, in the order shown. */
export const GROUPS: Group[] = ['Professional', 'Creative', 'Developer', 'Minimal'];

const GROUP_OF: Record<string, Group> = {
  showcase: 'Professional',
  brief: 'Professional',
  launchpad: 'Professional',
  maintainer: 'Professional',
  city: 'Creative',
  galaxy: 'Creative',
  snake: 'Creative',
  learning: 'Creative',
  terminal: 'Developer',
  neofetch: 'Developer',
  buildlog: 'Developer',
  minimal: 'Minimal',
  frontend: 'Developer',
  backend: 'Developer',
  devops: 'Developer',
  datalab: 'Developer',
  ossbuilder: 'Developer',
  framework: 'Developer',
  product: 'Professional',
  founder: 'Professional',
  ossproof: 'Professional',
  advocate: 'Professional',
  indie: 'Creative',
  animatedfrontend: 'Creative',
  spaceshooter: 'Creative',
  jetrunner: 'Creative',
  playablesignal: 'Creative',
  cinematic: 'Creative',
  wow: 'Creative',
  captip: 'Creative',
  creative: 'Creative',
  erased: 'Creative',
  passport: 'Creative',
  receipt: 'Creative',
  sheet: 'Creative',
  calendar: 'Creative',
  player: 'Creative',
  inbox: 'Professional',
  desktop: 'Creative',
  cockpit: 'Developer',
  metro: 'Creative',
  elements: 'Creative',
  treemap: 'Developer',
  shelf: 'Creative',
  card: 'Creative',
  polaroids: 'Creative',
  comic: 'Creative',
  wanted: 'Creative',
  recipe: 'Creative',
  nutrition: 'Minimal',
  postcard: 'Creative',
  ransom: 'Creative',
  departures: 'Developer',
  handheld: 'Creative',
  neon: 'Creative',
  laptop: 'Creative',
  pet: 'Creative',
  garden: 'Creative',
  ridgeline: 'Creative',
  pulse: 'Developer',
  drums: 'Creative',
  weather: 'Creative',
  rings: 'Minimal',
  tree: 'Creative',
  aquarium: 'Creative',
  island: 'Creative',
  circuit: 'Developer',
  sonar: 'Developer',
  cloud: 'Creative',
  timeline: 'Professional',
  sunburst: 'Creative',
  lava: 'Creative',
  globe: 'Creative',
  tarot: 'Creative',
  stamps: 'Creative',
  cube: 'Creative',
  topo: 'Creative',
  natal: 'Creative',
  stitch: 'Creative',
  punch: 'Creative',
  plinko: 'Creative',
  zine: 'Creative',
  contact: 'Creative',
  museum: 'Creative',
  patch: 'Creative',
  lock: 'Creative',
  moodboard: 'Creative',
  riso: 'Creative',
  glitch: 'Creative',
  thermal: 'Creative',
  halftone: 'Creative',
  mosaic: 'Creative',
  signature: 'Professional',
  frontpage: 'Professional',
  hub: 'Minimal',
};

export function groupOf(templateId: string): Group {
  return GROUP_OF[templateId] ?? 'Developer';
}

/** A year of made-up days, so the designs can be shown before anyone types a username. */
function sampleDays(): ContributionDay[] {
  const end = Date.UTC(2026, 5, 10);
  return Array.from({ length: 365 }, (_v, index) => {
    const date = new Date(end - (364 - index) * 86_400_000);
    const weekday = date.getUTCDay();
    const wave = Math.abs(Math.sin(index / 11)) * 6 + Math.abs(Math.cos(index / 5)) * 3;
    const count = weekday === 0 || weekday === 6 ? Math.floor(wave / 4) : Math.floor(wave);
    const level = (count === 0 ? 0 : Math.min(4, Math.ceil(count / 3))) as 0 | 1 | 2 | 3 | 4;
    return { date: date.toISOString().slice(0, 10), count, level };
  });
}

/**
 * Stand-in data, used only to show the designs before a real profile is loaded. Every screen that
 * uses it says so, and it never leaves the browser.
 */
const SAMPLE_BASE: Profile = {
  login: 'sample-user',
  name: 'Sample Person',
  avatarUrl: 'https://github.com/github.png',
  bio: 'Sample data, shown until you enter your own username.',
  company: null,
  location: null,
  website: null,
  url: 'https://github.com/sample-user',
  followers: 120,
  following: 48,
  publicRepos: 24,
  totalStars: 860,
  createdAt: '2019-03-12T00:00:00Z',
  languages: [
    { name: 'TypeScript', percent: 46 },
    { name: 'Go', percent: 28 },
    { name: 'Python', percent: 16 },
    { name: 'Rust', percent: 10 },
  ],
  topRepos: [
    { name: 'sample-project-one', description: 'An example repository.', stars: 540, forks: 61, language: 'TypeScript', pushedAt: '2026-06-02T09:00:00Z', url: 'https://github.com/sample-user/sample-project-one' },
    { name: 'sample-project-two', description: 'Another example repository.', stars: 210, forks: 18, language: 'Go', pushedAt: '2026-05-12T09:00:00Z', url: 'https://github.com/sample-user/sample-project-two' },
    { name: 'sample-project-three', description: 'A third example repository.', stars: 96, forks: 7, language: 'Python', pushedAt: '2026-02-01T09:00:00Z', url: 'https://github.com/sample-user/sample-project-three' },
  ],
  contributions: buildContributions(sampleDays()),
  fetchedAt: '2026-06-10T08:00:00Z',
};

/** A plain abstract picture, drawn here, standing in for a profile picture. It is not anybody's photo. */
function sampleAvatar(): Avatar | null {
  try {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    if (!context) return null;
    const fill = context.createLinearGradient(0, 0, size, size);
    fill.addColorStop(0, '#2fbf8f');
    fill.addColorStop(1, '#3b82f6');
    context.fillStyle = fill;
    context.fillRect(0, 0, size, size);
    context.fillStyle = 'rgba(255,255,255,0.85)';
    context.beginPath();
    context.arc(size / 2, size * 0.4, size * 0.17, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.ellipse(size / 2, size * 0.86, size * 0.32, size * 0.28, 0, Math.PI, 0);
    context.fill();
    const { data } = context.getImageData(0, 0, size, size);
    return { dataUri: canvas.toDataURL('image/png'), grid: gridFromRgba(data, size, size) };
  } catch {
    return null;
  }
}

let sample: Profile | undefined;

/** The stand-in profile, with its picture. Built once, on first use in the browser. */
export function sampleProfile(): Profile {
  if (!sample) {
    const avatar = sampleAvatar();
    sample = avatar ? { ...SAMPLE_BASE, avatar } : SAMPLE_BASE;
  }
  return sample;
}
