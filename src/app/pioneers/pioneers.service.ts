import { Injectable, computed, signal } from '@angular/core';
import { Pioneer, PioneerSort } from './pioneer';

const PIONEERS: Pioneer[] = [
  { id: 1, name: 'Alan Turing', nationality: 'British', born: 1912, died: 1954, field: 'Theory of computation', symbol: 'cpu', tint: '#5e5ce6', summary: 'Defined the abstract machine that underlies every computer, then led the wartime effort that broke Enigma at Bletchley Park.', achievements: ['The Turing machine, 1936', 'Bombe and Enigma codebreaking', 'The Turing test, 1950', 'Design of the ACE computer'], wikipedia: 'https://en.wikipedia.org/wiki/Alan_Turing' },
  { id: 2, name: 'Grace Hopper', nationality: 'American', born: 1906, died: 1992, field: 'Compilers and languages', symbol: 'apple.terminal', tint: '#ff375f', summary: 'Rear admiral who built the first compiler and championed English-like programming languages, which led to COBOL.', achievements: ['The A-0 compiler, 1952', 'FLOW-MATIC', 'COBOL', 'Popularized the term “debugging”'], wikipedia: 'https://en.wikipedia.org/wiki/Grace_Hopper' },
  { id: 3, name: 'Donald Knuth', nationality: 'American', born: 1938, field: 'Algorithms', symbol: 'book.closed', tint: '#ff9f0a', summary: 'Author of The Art of Computer Programming, and creator of TeX so that his own books could be typeset properly.', achievements: ['The Art of Computer Programming, 1968 onward', 'TeX and Metafont', 'Knuth–Morris–Pratt string search', 'Literate programming'], wikipedia: 'https://en.wikipedia.org/wiki/Donald_Knuth' },
  { id: 4, name: 'Ada Lovelace', nationality: 'British', born: 1815, died: 1852, field: 'The first program', symbol: 'function', tint: '#bf5af2', summary: 'Her notes on Babbage’s Analytical Engine contain the first published algorithm intended to run on a machine.', achievements: ['Note G, the Bernoulli number algorithm, 1843', 'Saw computing as more than arithmetic', 'Translated and expanded Menabrea’s paper'], wikipedia: 'https://en.wikipedia.org/wiki/Ada_Lovelace' },
  { id: 5, name: 'John von Neumann', nationality: 'Hungarian-American', born: 1903, died: 1957, field: 'Computer architecture', symbol: 'memorychip', tint: '#30d158', summary: 'The stored-program architecture in his 1945 EDVAC report is still the shape of nearly every computer.', achievements: ['The von Neumann architecture, 1945', 'Game theory', 'Monte Carlo methods', 'Cellular automata'], wikipedia: 'https://en.wikipedia.org/wiki/John_von_Neumann' },
  { id: 6, name: 'Tim Berners-Lee', nationality: 'British', born: 1955, field: 'The World Wide Web', symbol: 'globe', tint: '#0a84ff', summary: 'Wrote the first web browser and web server at CERN, then gave the World Wide Web away for free.', achievements: ['HTTP, HTML and URLs, 1989 to 1991', 'The first browser and server', 'Founded the W3C'], wikipedia: 'https://en.wikipedia.org/wiki/Tim_Berners-Lee' },
  { id: 7, name: 'Edsger Dijkstra', nationality: 'Dutch', born: 1930, died: 2002, field: 'Structured programming', symbol: 'arrow.triangle.branch', tint: '#64d2ff', summary: 'Found the shortest-path algorithm in twenty minutes at a café, then spent decades making programming rigorous.', achievements: ['Dijkstra’s algorithm, 1956', 'Semaphores', '“Go To Statement Considered Harmful”, 1968', 'The THE multiprogramming system'], wikipedia: 'https://en.wikipedia.org/wiki/Edsger_W._Dijkstra' },
  { id: 8, name: 'Linus Torvalds', nationality: 'Finnish-American', born: 1969, field: 'Open source', symbol: 'chevron.left.forwardslash.chevron.right', tint: '#ffd60a', summary: 'Started Linux as a hobby in 1991, then wrote Git in a matter of weeks when the kernel needed better version control.', achievements: ['The Linux kernel, 1991', 'Git, 2005'], wikipedia: 'https://en.wikipedia.org/wiki/Linus_Torvalds' },
  { id: 9, name: 'John McCarthy', nationality: 'American', born: 1927, died: 2011, field: 'Artificial intelligence', symbol: 'brain.head.profile', tint: '#ff453a', summary: 'Coined the term artificial intelligence and invented Lisp, giving the field its first language.', achievements: ['Lisp, 1958', 'Coined “artificial intelligence”, 1956', 'Time-sharing', 'Garbage collection'], wikipedia: 'https://en.wikipedia.org/wiki/John_McCarthy_(computer_scientist)' },
  { id: 10, name: 'Dennis Ritchie', nationality: 'American', born: 1941, died: 2011, field: 'C and Unix', symbol: 'c.square', tint: '#5e5ce6', summary: 'Created C and co-created Unix, the pair that most modern operating systems still descend from.', achievements: ['The C language, 1972', 'Unix, with Ken Thompson', '“The C Programming Language”, 1978'], wikipedia: 'https://en.wikipedia.org/wiki/Dennis_Ritchie' },
  { id: 11, name: 'Bjarne Stroustrup', nationality: 'Danish', born: 1950, field: 'C++', symbol: 'plus.square.on.square', tint: '#ac8e68', summary: 'Extended C with classes at Bell Labs to get Simula’s abstractions at C’s speed.', achievements: ['C++, 1985', 'ISO C++ standardization', '“The C++ Programming Language”'], wikipedia: 'https://en.wikipedia.org/wiki/Bjarne_Stroustrup' },
  { id: 12, name: 'Steve Wozniak', nationality: 'American', born: 1950, field: 'Personal computers', symbol: 'desktopcomputer', tint: '#30d158', summary: 'Designed the Apple I and Apple II almost single-handedly, making the personal computer approachable.', achievements: ['Apple I, 1976', 'Apple II, 1977', 'Co-founded Apple'], wikipedia: 'https://en.wikipedia.org/wiki/Steve_Wozniak' },
  { id: 13, name: 'Tommy Flowers', nationality: 'British', born: 1905, died: 1998, field: 'Electronic computing', symbol: 'bolt', tint: '#ff9f0a', summary: 'Built Colossus at Bletchley Park in 1943, the first programmable electronic digital computer.', achievements: ['Colossus, 1943', 'Proved thermionic valves reliable at scale'], wikipedia: 'https://en.wikipedia.org/wiki/Tommy_Flowers' },
  { id: 14, name: 'John Backus', nationality: 'American', born: 1924, died: 2007, field: 'FORTRAN', symbol: 'sum', tint: '#0a84ff', summary: 'Led the FORTRAN team at IBM and co-invented the Backus–Naur form used to describe programming languages.', achievements: ['FORTRAN, 1957', 'Backus–Naur form', 'The FP language, 1977'], wikipedia: 'https://en.wikipedia.org/wiki/John_Backus' },
  { id: 15, name: 'Niklaus Wirth', nationality: 'Swiss', born: 1934, died: 2024, field: 'Language design', symbol: 'square.stack.3d.up', tint: '#bf5af2', summary: 'Designed Pascal, Modula-2 and Oberon, each simpler than the last, and taught structured programming to a generation.', achievements: ['Pascal, 1970', 'Modula-2 and Oberon', '“Algorithms + Data Structures = Programs”'], wikipedia: 'https://en.wikipedia.org/wiki/Niklaus_Wirth' },
];

@Injectable({ providedIn: 'root' })
export class PioneersService {
  readonly all = signal<Pioneer[]>(PIONEERS);
  readonly sort = signal<PioneerSort>('curated');
  readonly bookmarked = signal<ReadonlySet<number>>(new Set([1, 4, 6]));
  /** Pioneer shown beside the list when there is room for two panes. */
  readonly selectedId = signal<number>(PIONEERS[0].id);

  readonly sorted = computed(() => {
    const list = [...this.all()];
    switch (this.sort()) {
      case 'name':
        return list.sort((a, b) => a.name.localeCompare(b.name));
      case 'era':
        return list.sort((a, b) => a.born - b.born);
      default:
        return list;
    }
  });

  readonly bookmarks = computed(() => {
    const set = this.bookmarked();
    return this.sorted().filter((p) => set.has(p.id));
  });

  readonly selected = computed(() => this.byId(this.selectedId()) ?? this.sorted()[0]);

  byId(id: number): Pioneer | undefined {
    return this.all().find((p) => p.id === id);
  }

  isBookmarked(id: number): boolean {
    return this.bookmarked().has(id);
  }

  toggleBookmark(id: number): boolean {
    const next = new Set(this.bookmarked());
    const added = !next.has(id);
    if (added) {
      next.add(id);
    } else {
      next.delete(id);
    }
    this.bookmarked.set(next);
    return added;
  }

  search(query: string): Pioneer[] {
    const q = query.trim().toLowerCase();
    if (!q) {
      return this.sorted();
    }
    return this.sorted().filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.field.toLowerCase().includes(q) ||
        p.nationality.toLowerCase().includes(q) ||
        p.achievements.some((a) => a.toLowerCase().includes(q)),
    );
  }

  /** Neighbours in the current sort order, for previous/next toolbar items. */
  neighbours(id: number): { previous?: Pioneer; next?: Pioneer } {
    const list = this.sorted();
    const index = list.findIndex((p) => p.id === id);
    return { previous: list[index - 1], next: list[index + 1] };
  }
}

export function lifespan(p: Pioneer): string {
  return p.died ? `${p.born}–${p.died}` : `b. ${p.born}`;
}
