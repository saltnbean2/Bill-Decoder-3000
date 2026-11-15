import type { SampleId } from "./types";

/** A spot on the document to circle, as fractions (0–1) of the image's width and height. */
export interface Mark {
  x: number;
  y: number;
  w: number;
  h: number;
  /** "box" for a whole empty field, "ring" (default) for words */
  shape?: "ring" | "box";
}

/*
 * Known positions of the problems on the built-in sample documents, measured from
 * public/samples/*.html (re-measure if a sample's layout changes).
 */
export const SAMPLE_MARKS: Partial<Record<SampleId, Mark[]>> = {
  // Ticket 620×877: "HONDA", "Toyota Camry" in the officer's remarks, the blank officer ID box.
  ticket: [
    { x: 0.589, y: 0.271, w: 0.137, h: 0.039 },
    { x: 0.161, y: 0.468, w: 0.186, h: 0.034 },
    { x: 0.05, y: 0.534, w: 0.531, h: 0.057, shape: "box" },
  ],
  // Scam letter 760×747: "48 HOURS", the fake phone number, "Apple or Target gift cards".
  scam: [
    { x: 0.286, y: 0.53, w: 0.105, h: 0.023 },
    { x: 0.633, y: 0.609, w: 0.132, h: 0.023 },
    { x: 0.293, y: 0.689, w: 0.233, h: 0.023 },
  ],
  // Roofing quote 776×746: "Misc materials", the total, "40% deposit".
  quote: [
    { x: 0.075, y: 0.598, w: 0.12, h: 0.021 },
    { x: 0.816, y: 0.693, w: 0.11, h: 0.025 },
    { x: 0.242, y: 0.779, w: 0.095, h: 0.02 },
  ],
};
