import type Anthropic from "@anthropic-ai/sdk";
import { HELP, OFFICIAL, formatPhone } from "./resources";
import { daysUntil } from "./normalize";

/*
 * Tools for the "Ask Doc Deco" agent. They only read our verified data, so the agent
 * can give real phone numbers and do date math instead of guessing.
 */

const TOPICS = ["parking_ticket", "jury_duty", "legal_help", "contractor", "auto_repair", "scam_or_fraud", "utility_bill", "general"] as const;
type Topic = (typeof TOPICS)[number];

const TOPIC_MAP: Record<Topic, (keyof typeof HELP)[]> = {
  parking_ticket: ["glendaleParking", "nls", "two11"],
  jury_duty: ["jury", "two11"],
  legal_help: ["nls", "two11"],
  contractor: ["cslb", "dcba"],
  auto_repair: ["bar", "dcba"],
  scam_or_fraud: ["dcba", "two11"],
  utility_bill: ["two11"],
  general: ["two11", "nls"],
};

export const AGENT_TOOLS: Anthropic.Messages.Tool[] = [
  {
    name: "find_local_help",
    description:
      "Look up verified free help lines and offices for people in Glendale / LA County, by topic. Always use this before giving a phone number for local help; never make up phone numbers.",
    input_schema: {
      type: "object",
      properties: { topic: { type: "string", enum: [...TOPICS] } },
      required: ["topic"],
      additionalProperties: false,
    },
  },
  {
    name: "check_official_number",
    description:
      "Check whether a phone number is the official number of a government agency (IRS, California Franchise Tax Board, Social Security, California DMV, Glendale Water & Power) or a known legitimate help line. Use it whenever someone asks if a number or a call or letter is real.",
    input_schema: {
      type: "object",
      properties: {
        phone: { type: "string", description: "The phone number to check" },
        claimed_agency: { type: "string", description: "Who the caller or letter claims to be, if known" },
      },
      required: ["phone"],
      additionalProperties: false,
    },
  },
  {
    name: "days_until",
    description: "Count the days from today (Los Angeles time) until a date. Negative means the date has passed.",
    input_schema: {
      type: "object",
      properties: { date: { type: "string", description: "YYYY-MM-DD" } },
      required: ["date"],
      additionalProperties: false,
    },
  },
];

const digits = (s: string) => s.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");

export function runAgentTool(name: string, input: unknown): { content: string; isError?: boolean } {
  const args = (typeof input === "object" && input !== null ? input : {}) as Record<string, unknown>;
  switch (name) {
    case "find_local_help": {
      const topic = TOPICS.includes(args.topic as Topic) ? (args.topic as Topic) : "general";
      const list = TOPIC_MAP[topic].map((k) => {
        const r = HELP[k];
        return { name: r.name, phone: r.phone, website: r.url, what_they_do: r.desc.en };
      });
      return { content: JSON.stringify(list) };
    }
    case "check_official_number": {
      const phone = typeof args.phone === "string" ? digits(args.phone) : "";
      if (phone.length !== 10) return { content: "Not a valid 10-digit US phone number.", isError: true };
      const claimed = typeof args.claimed_agency === "string" ? args.claimed_agency : "";
      const owner = OFFICIAL.find((o) => o.phones.includes(phone));
      const help = Object.values(HELP).find((r) => r.phone && digits(r.phone) === phone);
      const claimedAgency = OFFICIAL.find((o) => o.match.test(claimed));
      return {
        content: JSON.stringify({
          number: formatPhone(phone),
          is_official_agency_number: !!owner,
          belongs_to: owner?.name ?? help?.name ?? (phone === "8003664484" ? "Treasury Inspector General (TIGTA)" : null),
          claimed_agency: claimedAgency?.name ?? (claimed || null),
          claimed_agency_official_numbers: claimedAgency ? claimedAgency.phones.map(formatPhone) : null,
          matches_claimed_agency: claimedAgency ? claimedAgency.phones.includes(phone) : null,
          note: "Only a short list of agencies is known. If an agency is not in the list, tell the person to look up the number on the agency's official .gov website.",
        }),
      };
    }
    case "days_until": {
      const date = typeof args.date === "string" ? args.date : "";
      const d = daysUntil(date);
      return d === null ? { content: "Date must be YYYY-MM-DD.", isError: true } : { content: JSON.stringify({ date, days_from_today: d }) };
    }
    default:
      return { content: `Unknown tool ${name}`, isError: true };
  }
}
