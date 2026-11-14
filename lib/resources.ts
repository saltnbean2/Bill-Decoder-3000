import type { Analysis, DocType, Lang } from "./types";

/*
 * Real Glendale / LA County / California help lines and official agency numbers.
 * Verified Nov 2026 against the agencies' own sites or the LA County / 211 LA directories:
 *   Glendale parking citations  (866) 470-3088  glendaleca.gov Traffic & Parking page
 *   Glendale Water & Power      (818) 548-3300  LA County locator + 211 LA
 *   211 LA County               2-1-1 / (800) 339-6993  211la.org
 *   Neighborhood Legal Services (800) 433-6251  LA County locator (all offices' intake line)
 *   LA County DCBA              (800) 593-8222  dcba.lacounty.gov/contact-us
 *   CSLB                        (800) 321-2752  cslb.ca.gov Contact CSLB
 *   Bureau of Automotive Repair (800) 952-5210  bar.ca.gov/contact-us
 *   IRS (800) 829-1040, FTB (800) 852-5711, SSA (800) 772-1213, CA DMV (800) 777-0133
 *   LA Superior Court Juror Services (213) 972-0970 (court mirrors only: shown as help, not used for the scam check)
 * Re-check before a public launch.
 */

type L = Record<Lang, string>;

export interface HelpResource {
  name: string;
  phone?: string;
  url?: string;
  desc: L;
}

export const HELP = {
  two11: {
    name: "211 LA County",
    phone: "211",
    url: "https://211la.org",
    desc: {
      en: "Free, 24/7. Connects you to local help in 140+ languages.",
      hy: "Անվճար, 24/7։ Կապում է տեղական օգնության հետ 140+ լեզուներով, նաև հայերեն։",
      es: "Gratis, 24/7. Le conecta con ayuda local en más de 140 idiomas.",
      ko: "무료, 24시간. 140개 이상 언어로 지역 도움을 연결해 드려요.",
      tl: "Libre, 24/7. Ikinokonekta ka sa lokal na tulong sa 140+ na wika.",
    },
  },
  nls: {
    name: "Neighborhood Legal Services of LA County",
    phone: "(800) 433-6251",
    url: "https://nlsla.org",
    desc: {
      en: "Free legal help for low-income LA County residents.",
      hy: "Անվճար իրավաբանական օգնություն LA County-ի ցածր եկամուտ ունեցող բնակիչների համար։",
      es: "Ayuda legal gratis para residentes de bajos ingresos del Condado de LA.",
      ko: "LA 카운티 저소득 주민을 위한 무료 법률 도움.",
      tl: "Libreng legal na tulong para sa mga residenteng mababa ang kita sa LA County.",
    },
  },
  glendaleParking: {
    name: "City of Glendale Parking Citation Center",
    phone: "(866) 470-3088",
    url: "https://www.glendaleca.gov/government/departments/police-department/traffic-parking",
    desc: {
      en: "For City of Glendale tickets. Contest within 21 days of the ticket date.",
      hy: "Գլենդել քաղաքի տուգանքների համար։ Բողոքարկեք տուգանքի օրվանից 21 օրվա ընթացքում։",
      es: "Para multas de la Ciudad de Glendale. Dispute dentro de 21 días de la fecha de la multa.",
      ko: "글렌데일 시 주차 딱지용. 발부일로부터 21일 안에 이의 신청하세요.",
      tl: "Para sa mga tiket ng City of Glendale. Mag-contest sa loob ng 21 araw mula sa petsa ng tiket.",
    },
  },
  dcba: {
    name: "LA County Consumer & Business Affairs",
    phone: "(800) 593-8222",
    url: "https://dcba.lacounty.gov",
    desc: {
      en: "Free help with scams, fraud and unfair business practices.",
      hy: "Անվճար օգնություն խարդախությունների և անարդար բիզնես գործելակերպի դեպքում։",
      es: "Ayuda gratis con estafas, fraudes y negocios injustos.",
      ko: "사기, 부정 거래 피해에 대한 무료 도움.",
      tl: "Libreng tulong sa scam, panloloko at hindi patas na negosyo.",
    },
  },
  cslb: {
    name: "Contractors State License Board (CSLB)",
    phone: "(800) 321-2752",
    url: "https://www.cslb.ca.gov",
    desc: {
      en: "Check a contractor's license or file a complaint. Free.",
      hy: "Ստուգեք կապալառուի լիցենզիան կամ ներկայացրեք բողոք։ Անվճար։",
      es: "Verifique la licencia de un contratista o ponga una queja. Gratis.",
      ko: "시공업자 면허 확인 또는 민원 접수. 무료.",
      tl: "I-check ang lisensya ng kontratista o magreklamo. Libre.",
    },
  },
  bar: {
    name: "Bureau of Automotive Repair",
    phone: "(800) 952-5210",
    url: "https://www.bar.ca.gov",
    desc: {
      en: "For auto repair shops: check a shop or file a complaint.",
      hy: "Ավտոսպասարկման համար՝ ստուգեք արհեստանոցը կամ բողոք ներկայացրեք։",
      es: "Para talleres de autos: verifique un taller o ponga una queja.",
      ko: "자동차 정비소 확인 또는 민원 접수.",
      tl: "Para sa mga talyer ng sasakyan: i-check o magreklamo.",
    },
  },
  jury: {
    name: "LA Superior Court Juror Services",
    phone: "(213) 972-0970",
    url: "https://www.lacourt.org/jury",
    desc: {
      en: "For LA County jury summonses. Check the number printed on your summons too.",
      hy: "LA County-ի երդվյալ ատենակալների կանչերի համար։ Ստուգեք նաև ձեր կանչի վրա տպված համարը։",
      es: "Para citaciones de jurado del Condado de LA. Revise también el número de su citación.",
      ko: "LA 카운티 배심원 소환용. 소환장에 적힌 번호도 확인하세요.",
      tl: "Para sa jury summons ng LA County. Tingnan din ang numero sa summons mo.",
    },
  },
} satisfies Record<string, HelpResource>;
const R = HELP;

export function helpFor(a: Analysis): HelpResource[] {
  const text = `${a.sender ?? ""} ${a.headline} ${a.summary}`.toLowerCase();
  const byType: Record<DocType, HelpResource[]> = {
    parking_ticket: [...(/glendale/.test(text) && !/fairview/.test(text) ? [R.glendaleParking] : []), R.nls, R.two11],
    official_letter: [...(/jury|juror/.test(text) ? [R.jury] : []), R.nls, R.dcba, R.two11],
    contractor_quote: [/auto|mechanic|car repair|body shop|vehicle/.test(text) ? R.bar : R.cslb, R.dcba, R.two11],
    other_document: [R.nls, R.two11],
    unreadable: [R.two11],
  };
  return byType[a.document_type];
}

/* ---------- Official-number scam check ---------- */

export interface OfficialAgency {
  name: string;
  match: RegExp;
  phones: string[]; // digits only
  domains: string[];
}

export const OFFICIAL: OfficialAgency[] = [
  { name: "IRS", match: /\birs\b|internal revenue/i, phones: ["8008291040"], domains: ["irs.gov"] },
  { name: "California Franchise Tax Board", match: /franchise tax|\bftb\b/i, phones: ["8008525711"], domains: ["ftb.ca.gov"] },
  { name: "Social Security Administration", match: /social security/i, phones: ["8007721213"], domains: ["ssa.gov"] },
  { name: "California DMV", match: /\bdmv\b|motor vehicles/i, phones: ["8007770133"], domains: ["dmv.ca.gov"] },
  { name: "Glendale Water & Power", match: /glendale water|\bgwp\b/i, phones: ["8185483300", "8185482011"], domains: ["glendaleca.gov"] },
];

export type NumberCheck =
  | { agency: OfficialAgency; status: "match"; found: string[] }
  | { agency: OfficialAgency; status: "mismatch"; found: string[]; bad: string[] }
  | null;

const PHONE_RE = /(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g;
const digits = (s: string) => s.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");

/** If the letter claims to be from a known agency, compare its phone numbers with the official ones. */
export function checkOfficialNumbers(a: Analysis): NumberCheck {
  if (a.document_type !== "official_letter" && a.document_type !== "other_document") return null;
  const who = `${a.sender ?? ""} ${a.headline}`;
  const agency = OFFICIAL.find((o) => o.match.test(who));
  if (!agency) return null;
  const blob = [a.sender, a.summary, ...a.action_steps.flatMap((s) => [s.detail, s.contact]), ...(a.legitimacy_check?.reasons ?? []), ...a.red_flags.map((f) => f.text)]
    .filter(Boolean)
    .join(" ");
  const found = [...new Set((blob.match(PHONE_RE) ?? []).map((p) => p.trim()))];
  if (!found.length) return null;
  // Only flag numbers that aren't any known-legitimate line (the model's own advice may cite real ones).
  const knownGood = new Set([
    ...OFFICIAL.flatMap((o) => o.phones),
    ...Object.values(R).flatMap((r) => ("phone" in r && r.phone ? [digits(r.phone)] : [])),
    "8003664484", // Treasury Inspector General for Tax Administration (reports IRS impersonation)
    "8773824357", // FTC fraud line
  ]);
  const bad = found.filter((p) => !knownGood.has(digits(p)));
  return bad.length ? { agency, status: "mismatch", found, bad } : { agency, status: "match", found };
}

export function formatPhone(d: string) {
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}
