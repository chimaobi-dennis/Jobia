// Mock stand-in for real resume parsing. In lieu of an LLM call, this
// simulates the delay of parsing and returns a plausible-looking summary
// derived from the file name and the job, so the "upload -> pre-filled
// form" UX can be demoed without a real parser.

export interface ParsedResume {
  summary: string;
}

export async function mockParseResume(
  file: File,
  jobTitle: string,
): Promise<ParsedResume> {
  await new Promise((resolve) => setTimeout(resolve, 900));

  const baseName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ");

  return {
    summary:
      `Parsed from ${baseName || "the uploaded résumé"}: relevant ` +
      `experience and skills for the ${jobTitle} role. (This is a mock ` +
      `summary — no real resume parsing has run.)`,
  };
}
