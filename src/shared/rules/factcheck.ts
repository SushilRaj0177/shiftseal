import type { CitedFact } from '../types.js';

export interface FactCheckResult {
  passed: boolean;
  reason?: string;
}

export function check(
  citedFacts: CitedFact[],
  truthMap: Record<string, number>,
  answerText?: string
): FactCheckResult {
  if (!citedFacts || citedFacts.length === 0) {
    return {
      passed: false,
      reason: 'No cited facts provided for verification.',
    };
  }

  for (const cited of citedFacts) {
    if (!(cited.ref in truthMap)) {
      return {
        passed: false,
        reason: `Cited reference "${cited.ref}" does not exist in ground-truth map.`,
      };
    }

    const truthValue = truthMap[cited.ref];
    const isHours = /hours$/i.test(cited.ref);
    const diff = Math.abs(cited.value - truthValue);

    if (isHours) {
      if (diff > 0.01 + 1e-9) {
        return {
          passed: false,
          reason: `Hours mismatch on "${cited.ref}": AI cited ${cited.value}, truth is ${truthValue}.`,
        };
      }
    } else {
      // Money or exact count: must match to the paisa (0.001 tolerance for float representation)
      const citedPaisa = Math.round(cited.value * 100);
      const truthPaisa = Math.round(truthValue * 100);
      if (citedPaisa !== truthPaisa) {
        return {
          passed: false,
          reason: `Money/value mismatch on "${cited.ref}": AI cited ${cited.value}, truth is ${truthValue}.`,
        };
      }
    }
  }

  // If answerText is provided, verify that every standalone number in the text corresponds to a cited fact
  if (answerText) {
    const numberMatches = answerText.match(/\d+(?:,\d{3})*(?:\.\d+)?/g) ?? [];
    const citedValues = citedFacts.map((f) => f.value);

    for (const rawNum of numberMatches) {
      const parsed = Number(rawNum.replace(/,/g, ''));
      if (Number.isNaN(parsed)) continue;

      const matchesCited = citedValues.some((cv) => Math.abs(cv - parsed) <= 0.01 + 1e-9);
      if (!matchesCited) {
        return {
          passed: false,
          reason: `Answer contains uncited number ${parsed}.`,
        };
      }
    }
  }

  return { passed: true };
}
