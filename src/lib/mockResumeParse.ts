// Mock stand-in for real resume parsing. In lieu of an LLM call, this
// simulates the delay of parsing and returns plausible-looking candidate
// fields derived from the file name and the job, so the "upload -> pre-
// filled form" UX can be demoed without a real parser.

export interface ParsedResume {
  name: string | null;
  email: string | null;
  location: string;
  experience: string;
  summary: string;
}

const MOCK_LOCATIONS = [
  "San Francisco, CA",
  "New York, NY",
  "Austin, TX",
  "Remote",
  "Chicago, IL",
];

const MOCK_EXPERIENCE = [
  "3 years",
  "5 years",
  "7+ years",
  "2 years",
  "10+ years",
];

function pick<T>(options: T[], seed: string): T {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return options[hash % options.length];
}

function guessNameFromFileName(baseName: string): string | null {
  const cleaned = baseName
    .replace(/\b(resume|cv|final|copy|updated|draft)\b/gi, "")
    .trim();
  if (!cleaned) return null;

  return cleaned
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export async function mockParseResume(
  file: File,
  jobTitle: string,
): Promise<ParsedResume> {
  await new Promise((resolve) => setTimeout(resolve, 900));

  const baseName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ");
  const guessedName = guessNameFromFileName(baseName);

  return {
    name: guessedName,
    email: null,
    location: pick(MOCK_LOCATIONS, file.name),
    experience: pick(MOCK_EXPERIENCE, jobTitle + file.name),
    summary:
      `Parsed from ${baseName || "the uploaded résumé"}: relevant ` +
      `experience and skills for the ${jobTitle} role. (This is a mock ` +
      `summary — no real resume parsing has run.)`,
  };
}
