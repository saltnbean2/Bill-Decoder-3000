import { HELP, type HelpResource } from "./resources";
import type { Lang } from "./types";

type L = Record<Lang, string>;

/* Official agency lines (numbers verified, see lib/resources.ts). */
const OFFICIAL_DESC: L = {
  en: "Official number. Use it to check if a letter or call is real.",
  hy: "Պաշտոնական համար։ Օգտագործեք՝ ստուգելու, արդյոք նամակը կամ զանգը իսկական է։",
  es: "Número oficial. Úselo para verificar si una carta o llamada es real.",
  ko: "공식 번호예요. 편지나 전화가 진짜인지 확인할 때 쓰세요.",
  tl: "Opisyal na numero. Gamitin para i-check kung totoo ang sulat o tawag.",
};
const official = (name: string, phone: string, url: string): HelpResource => ({ name, phone, url, desc: OFFICIAL_DESC });

const GWP: HelpResource = {
  name: "Glendale Water & Power",
  phone: "(818) 548-3300",
  url: "https://www.glendaleca.gov/government/departments/glendale-water-and-power",
  desc: {
    en: "Customer service for your water and power bill. Emergencies: (818) 548-2011.",
    hy: "Ջրի և էլեկտրականության հաշվի հաճախորդների սպասարկում։ Արտակարգ դեպքեր՝ (818) 548-2011։",
    es: "Servicio al cliente para su factura de agua y luz. Emergencias: (818) 548-2011.",
    ko: "수도·전기 요금 고객센터. 긴급: (818) 548-2011.",
    tl: "Customer service para sa bill sa tubig at kuryente. Emergency: (818) 548-2011.",
  },
};

export interface DirectorySection {
  icon: string;
  title: L;
  items: HelpResource[];
}

export const DIRECTORY: DirectorySection[] = [
  {
    icon: "🆘",
    title: { en: "Not sure where to start", hy: "Չգիտեք՝ որտեղից սկսել", es: "No sabe por dónde empezar", ko: "어디서 시작할지 모르겠다면", tl: "Hindi alam kung saan magsisimula" },
    items: [HELP.two11],
  },
  {
    icon: "🅿️",
    title: { en: "Parking tickets", hy: "Կայանման տուգանքներ", es: "Multas de estacionamiento", ko: "주차 딱지", tl: "Parking ticket" },
    items: [HELP.glendaleParking],
  },
  {
    icon: "⚖️",
    title: { en: "Free legal help & courts", hy: "Անվճար իրավաբանական օգնություն և դատարաններ", es: "Ayuda legal gratis y cortes", ko: "무료 법률 도움·법원", tl: "Libreng legal na tulong at korte" },
    items: [HELP.nls, HELP.jury],
  },
  {
    icon: "🛡️",
    title: { en: "Scams & fraud", hy: "Խարդախություններ", es: "Estafas y fraudes", ko: "사기 피해", tl: "Scam at panloloko" },
    items: [HELP.dcba],
  },
  {
    icon: "🔨",
    title: { en: "Contractors & auto repair", hy: "Կապալառուներ և ավտովերանորոգում", es: "Contratistas y talleres", ko: "시공업자·자동차 정비", tl: "Kontratista at talyer" },
    items: [HELP.cslb, HELP.bar],
  },
  {
    icon: "💡",
    title: { en: "Utilities", hy: "Կոմունալ ծառայություններ", es: "Servicios públicos", ko: "공공요금", tl: "Utilities" },
    items: [GWP],
  },
  {
    icon: "🏛️",
    title: { en: "Taxes & government (official numbers)", hy: "Հարկեր և պետական մարմիններ (պաշտոնական համարներ)", es: "Impuestos y gobierno (números oficiales)", ko: "세금·정부 기관 (공식 번호)", tl: "Buwis at gobyerno (opisyal na numero)" },
    items: [
      official("IRS", "(800) 829-1040", "https://www.irs.gov"),
      official("California Franchise Tax Board", "(800) 852-5711", "https://www.ftb.ca.gov"),
      official("Social Security Administration", "(800) 772-1213", "https://www.ssa.gov"),
      official("California DMV", "(800) 777-0133", "https://www.dmv.ca.gov"),
    ],
  },
];
