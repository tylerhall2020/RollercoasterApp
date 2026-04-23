// Keyword-based crisis signal detection. This is a first-pass safety net —
// Claude on the backend also performs a more nuanced assessment.
const CRISIS_PHRASES = [
  "don't want to be here",
  "don't want to live",
  "want to die",
  "want to kill myself",
  "thinking about suicide",
  "end my life",
  "end it all",
  "no reason to live",
  "can't go on",
  "give up on life",
  "hurt myself",
  "harm myself",
  "not worth living",
  "wish i was dead",
];

export function hasCrisisSignal(text: string): boolean {
  const lower = text.toLowerCase();
  return CRISIS_PHRASES.some((phrase) => lower.includes(phrase));
}

export const CRISIS_RESOURCES = {
  hotline: '988',
  hotlineLabel: 'Suicide & Crisis Lifeline',
  text: 'Text HOME to 741741',
  textLabel: 'Crisis Text Line',
  website: 'https://988lifeline.org',
};
