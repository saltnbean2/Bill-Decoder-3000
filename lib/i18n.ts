import type { Lang } from "./types";
import { EXTRA, type ExtraStrings } from "./i18n-extra";

export const LANG_LABELS: Record<Lang, string> = {
  en: "EN",
  hy: "ՀԱՅ",
  es: "ES",
  ko: "한국어",
  tl: "TL",
};

export const LANG_FULL: Record<Lang, string> = {
  en: "English",
  hy: "Հայերեն",
  es: "Español",
  ko: "한국어",
  tl: "Tagalog",
};

export interface Strings extends ExtraStrings {
  appName: string;
  tagline: string;
  scan: string;
  upload: string;
  trySample: string;
  sampleTicket: string;
  sampleLetter: string;
  sampleQuote: string;
  privacy: string;
  loading: [string, string, string, string];
  docType: { parking_ticket: string; official_letter: string; contractor_quote: string; other_document: string; unreadable: string };
  daysLeft: (n: number) => string;
  dueToday: string;
  dueTomorrow: string;
  passed: (n: number) => string;
  noDeadline: string;
  deadlineUnknownDate: string;
  scamTitle: { be_careful: string; likely_scam: string };
  whatMeans: string;
  amountDue: string;
  from: string;
  whatToDo: string;
  tapToCheck: string;
  contestStrength: string;
  strength: { strong: string; possible: string; weak: string };
  problemsFound: string;
  possibleGrounds: string;
  letterReady: string;
  letterNote: string;
  editBrackets: string;
  copy: string;
  copied: string;
  email: string;
  emailSubject: string;
  priceCheck: string;
  verdict: { good_deal: string; fair: string; high: string; very_high: string };
  aboveTypical: (n: number) => string;
  belowTypical: (n: number) => string;
  aboutTypical: string;
  quoted: string;
  typical: string;
  estimates: string;
  lineItems: string;
  rating: { low: string; fair: string; high: string; very_high: string; unclear: string };
  noLicense: string;
  license: string;
  verifyAt: string;
  askBefore: string;
  ifIgnored: string;
  redFlags: string;
  lowConfidence: string;
  disclaimer: string;
  scanAnother: string;
  unreadableTitle: string;
  unreadableTips: string[];
  tryAgain: string;
  errorTitle: string;
  errorBody: string;
  translating: string;
  translateFailed: string;
  language: string;
  stillReading: string;
  serverErrorTitle: string;
  serverErrorBody: string;
  retry: string;
  backHome: string;
  pdfTooBig: string;
  backTo: (language: string) => string;
}

const en: Base = {
  appName: "Doc Deco",
  tagline: "Any paperwork. Explained in your language.",
  scan: "Scan a document",
  upload: "Upload a photo",
  trySample: "Try a sample",
  sampleTicket: "Parking ticket",
  sampleLetter: "Court letter",
  sampleQuote: "Contractor quote",
  privacy: "Your photo is never saved.",
  loading: ["Reading your document…", "Figuring out what it is…", "Checking for problems…", "Writing your next steps…"],
  docType: {
    parking_ticket: "🅿️ Parking ticket",
    official_letter: "✉️ Official letter",
    contractor_quote: "🔨 Contractor quote",
    other_document: "📄 Document",
    unreadable: "📷 Hard to read",
  },
  daysLeft: (n) => (n === 1 ? "1 day left" : `${n} days left`),
  dueToday: "Due today",
  dueTomorrow: "Due tomorrow",
  passed: (n) => (n === 1 ? "Deadline passed 1 day ago" : `Deadline passed ${n} days ago`),
  noDeadline: "No deadline found",
  deadlineUnknownDate: "Deadline",
  scamTitle: { be_careful: "Be careful with this one", likely_scam: "This might be a scam" },
  whatMeans: "What this means",
  amountDue: "Amount",
  from: "From",
  whatToDo: "What to do",
  tapToCheck: "Tap a step when it's done.",
  contestStrength: "Can you fight this ticket?",
  strength: { strong: "Strong case", possible: "Possible case", weak: "Weak case" },
  problemsFound: "Problems on the ticket",
  possibleGrounds: "Other things to check",
  letterReady: "Your appeal letter is ready",
  letterNote: "The letter is in English because the city processes appeals in English.",
  editBrackets: "Edit the yellow parts before you send it.",
  copy: "Copy letter",
  copied: "Copied ✓",
  email: "Email it",
  emailSubject: "Request for initial review of parking citation",
  priceCheck: "Is this a fair price?",
  verdict: { good_deal: "Good deal", fair: "Fair", high: "High", very_high: "Very high" },
  aboveTypical: (n) => `~${n}% above typical`,
  belowTypical: (n) => `~${n}% below typical`,
  aboutTypical: "About typical",
  quoted: "Quoted",
  typical: "Typical",
  estimates: "Typical prices are estimates for the LA area.",
  lineItems: "Line by line",
  rating: { low: "Low", fair: "Fair", high: "High", very_high: "Very high", unclear: "Unclear" },
  noLicense: "No license number on this quote",
  license: "License",
  verifyAt: "verify at",
  askBefore: "Ask them this before you sign",
  ifIgnored: "If you ignore this",
  redFlags: "Things to watch",
  lowConfidence: "Some parts were hard to read. Double-check the details against your document.",
  disclaimer: "Doc Deco helps you understand documents. It's not legal advice.",
  scanAnother: "Scan another",
  unreadableTitle: "We couldn't read that one",
  unreadableTips: [
    "Lay the paper flat on a table",
    "Use good light, no shadows",
    "Fit the whole page in the photo",
    "Hold the phone steady and straight above it",
  ],
  tryAgain: "Take a new photo",
  errorTitle: "Couldn't read that",
  errorBody: "Try a clearer, flatter photo with good light.",
  translating: "Translating…",
  translateFailed: "Couldn't translate right now. Showing the last version.",
  language: "Language",
  stillReading: "Still reading — this usually takes 15–20 seconds.",
  serverErrorTitle: "We couldn't finish that",
  serverErrorBody: "Your photo is probably fine. The connection was slow or the service was busy.",
  retry: "Try again",
  backHome: "Back to start",
  pdfTooBig: "That PDF is too big to send. Take a photo of the page instead.",
  backTo: (l) => `Back to ${l}`,
};

const hy: Base = {
  appName: "Doc Deco",
  tagline: "Ցանկացած փաստաթուղթ՝ բացատրված ձեր լեզվով։",
  scan: "Լուսանկարել փաստաթուղթը",
  upload: "Վերբեռնել լուսանկար",
  trySample: "Փորձել օրինակով",
  sampleTicket: "Կայանման տուգանք",
  sampleLetter: "Պաշտոնական նամակ",
  sampleQuote: "Կապալառուի գնահատում",
  privacy: "Ձեր լուսանկարը երբեք չի պահպանվում։",
  loading: [
    "Կարդում ենք ձեր փաստաթուղթը…",
    "Պարզում ենք, թե ինչ է սա…",
    "Ստուգում ենք խնդիրները…",
    "Գրում ենք ձեր հաջորդ քայլերը…",
  ],
  docType: {
    parking_ticket: "🅿️ Կայանման տուգանք",
    official_letter: "✉️ Պաշտոնական նամակ",
    contractor_quote: "🔨 Կապալառուի գնահատում",
    other_document: "📄 Փաստաթուղթ",
    unreadable: "📷 Դժվար է կարդալ",
  },
  daysLeft: (n) => `Մնացել է ${n} օր`,
  dueToday: "Վերջնաժամկետը այսօր է",
  dueTomorrow: "Վերջնաժամկետը վաղն է",
  passed: (n) => `Վերջնաժամկետն անցել է ${n} օր առաջ`,
  noDeadline: "Վերջնաժամկետ չի գտնվել",
  deadlineUnknownDate: "Վերջնաժամկետ",
  scamTitle: { be_careful: "Զգույշ եղեք սրա հետ", likely_scam: "Սա կարող է խարդախություն լինել" },
  whatMeans: "Ինչ է սա նշանակում",
  amountDue: "Գումար",
  from: "Ուղարկող",
  whatToDo: "Ինչ անել",
  tapToCheck: "Սեղմեք քայլի վրա, երբ այն արված է։",
  contestStrength: "Կարո՞ղ եք բողոքարկել այս տուգանքը",
  strength: { strong: "Ուժեղ հիմք", possible: "Հնարավոր հիմք", weak: "Թույլ հիմք" },
  problemsFound: "Տուգանքի վրա գտնված խնդիրներ",
  possibleGrounds: "Ուրիշ բաներ, որ պետք է ստուգել",
  letterReady: "Ձեր բողոքի նամակը պատրաստ է",
  letterNote: "Նամակը անգլերեն է, քանի որ քաղաքը բողոքները քննում է անգլերենով։",
  editBrackets: "Ուղարկելուց առաջ խմբագրեք դեղին մասերը։",
  copy: "Պատճենել նամակը",
  copied: "Պատճենված է ✓",
  email: "Ուղարկել էլ. փոստով",
  emailSubject: "Request for initial review of parking citation",
  priceCheck: "Արդա՞ր է այս գինը",
  verdict: { good_deal: "Լավ գին", fair: "Արդար", high: "Բարձր", very_high: "Շատ բարձր" },
  aboveTypical: (n) => `~${n}% բարձր սովորականից`,
  belowTypical: (n) => `~${n}% ցածր սովորականից`,
  aboutTypical: "Մոտավորապես սովորական",
  quoted: "Առաջարկված",
  typical: "Սովորական",
  estimates: "Սովորական գները մոտավոր գնահատումներ են Լոս Անջելեսի համար։",
  lineItems: "Կետ առ կետ",
  rating: { low: "Ցածր", fair: "Արդար", high: "Բարձր", very_high: "Շատ բարձր", unclear: "Անհասկանալի" },
  noLicense: "Այս գնահատման վրա լիցենզիայի համար չկա",
  license: "Լիցենզիա",
  verifyAt: "ստուգեք՝",
  askBefore: "Հարցրեք սա ստորագրելուց առաջ",
  ifIgnored: "Եթե անտեսեք սա",
  redFlags: "Ուշադրություն դարձրեք",
  lowConfidence: "Որոշ մասեր դժվար էր կարդալ։ Ստուգեք մանրամասները ձեր փաստաթղթի հետ։",
  disclaimer: "Doc Deco-ն օգնում է հասկանալ փաստաթղթերը։ Սա իրավաբանական խորհուրդ չէ։",
  scanAnother: "Լուսանկարել ուրիշը",
  unreadableTitle: "Չկարողացանք կարդալ սա",
  unreadableTips: [
    "Թուղթը հարթ դրեք սեղանին",
    "Լավ լույս օգտագործեք, առանց ստվերների",
    "Ամբողջ էջը թող երևա լուսանկարում",
    "Հեռախոսը պահեք անշարժ և ուղիղ վերևից",
  ],
  tryAgain: "Նոր լուսանկար անել",
  errorTitle: "Չհաջողվեց կարդալ",
  errorBody: "Փորձեք ավելի պարզ, հարթ լուսանկար՝ լավ լույսով։",
  translating: "Թարգմանում ենք…",
  translateFailed: "Հիմա չհաջողվեց թարգմանել։ Ցույց ենք տալիս նախորդ տարբերակը։",
  language: "Լեզու",
  stillReading: "Դեռ կարդում ենք․ սովորաբար տևում է 15–20 վայրկյան։",
  serverErrorTitle: "Չհաջողվեց ավարտել",
  serverErrorBody: "Ձեր լուսանկարը, հավանաբար, լավն է։ Կապը դանդաղ էր, կամ ծառայությունը զբաղված էր։",
  retry: "Կրկին փորձել",
  backHome: "Վերադառնալ սկիզբ",
  pdfTooBig: "Այդ PDF-ը շատ մեծ է։ Փոխարենը լուսանկարեք էջը։",
  backTo: (l) => `↩ ${l}`,
};

const es: Base = {
  appName: "Doc Deco",
  tagline: "Cualquier papel. Explicado en su idioma.",
  scan: "Escanear un documento",
  upload: "Subir una foto",
  trySample: "Probar un ejemplo",
  sampleTicket: "Multa de estacionamiento",
  sampleLetter: "Carta oficial",
  sampleQuote: "Presupuesto de contratista",
  privacy: "Su foto nunca se guarda.",
  loading: ["Leyendo su documento…", "Averiguando qué es…", "Buscando problemas…", "Escribiendo sus próximos pasos…"],
  docType: {
    parking_ticket: "🅿️ Multa de estacionamiento",
    official_letter: "✉️ Carta oficial",
    contractor_quote: "🔨 Presupuesto de contratista",
    other_document: "📄 Documento",
    unreadable: "📷 Difícil de leer",
  },
  daysLeft: (n) => (n === 1 ? "Queda 1 día" : `Quedan ${n} días`),
  dueToday: "Vence hoy",
  dueTomorrow: "Vence mañana",
  passed: (n) => (n === 1 ? "La fecha límite pasó hace 1 día" : `La fecha límite pasó hace ${n} días`),
  noDeadline: "No se encontró fecha límite",
  deadlineUnknownDate: "Fecha límite",
  scamTitle: { be_careful: "Tenga cuidado con esto", likely_scam: "Esto podría ser una estafa" },
  whatMeans: "Qué significa",
  amountDue: "Monto",
  from: "De",
  whatToDo: "Qué hacer",
  tapToCheck: "Toque un paso cuando lo termine.",
  contestStrength: "¿Puede disputar esta multa?",
  strength: { strong: "Caso fuerte", possible: "Caso posible", weak: "Caso débil" },
  problemsFound: "Problemas en la multa",
  possibleGrounds: "Otras cosas para revisar",
  letterReady: "Su carta de apelación está lista",
  letterNote: "La carta está en inglés porque la ciudad revisa las apelaciones en inglés.",
  editBrackets: "Cambie las partes amarillas antes de enviarla.",
  copy: "Copiar carta",
  copied: "Copiada ✓",
  email: "Enviar por correo",
  emailSubject: "Request for initial review of parking citation",
  priceCheck: "¿Es un precio justo?",
  verdict: { good_deal: "Buen precio", fair: "Justo", high: "Alto", very_high: "Muy alto" },
  aboveTypical: (n) => `~${n}% más de lo normal`,
  belowTypical: (n) => `~${n}% menos de lo normal`,
  aboutTypical: "Más o menos normal",
  quoted: "Cotizado",
  typical: "Normal",
  estimates: "Los precios normales son estimados para el área de Los Ángeles.",
  lineItems: "Punto por punto",
  rating: { low: "Bajo", fair: "Justo", high: "Alto", very_high: "Muy alto", unclear: "Poco claro" },
  noLicense: "Este presupuesto no tiene número de licencia",
  license: "Licencia",
  verifyAt: "verifique en",
  askBefore: "Pregunte esto antes de firmar",
  ifIgnored: "Si no hace nada",
  redFlags: "Cosas a vigilar",
  lowConfidence: "Algunas partes eran difíciles de leer. Revise los datos con su documento.",
  disclaimer: "Doc Deco le ayuda a entender documentos. No es asesoría legal.",
  scanAnother: "Escanear otro",
  unreadableTitle: "No pudimos leer este",
  unreadableTips: [
    "Ponga el papel plano sobre una mesa",
    "Use buena luz, sin sombras",
    "Que toda la página quepa en la foto",
    "Sostenga el teléfono firme y derecho encima",
  ],
  tryAgain: "Tomar otra foto",
  errorTitle: "No se pudo leer",
  errorBody: "Pruebe con una foto más clara y plana, con buena luz.",
  translating: "Traduciendo…",
  translateFailed: "No se pudo traducir ahora. Mostrando la versión anterior.",
  language: "Idioma",
  stillReading: "Todavía leyendo… normalmente tarda 15–20 segundos.",
  serverErrorTitle: "No pudimos terminar",
  serverErrorBody: "Su foto probablemente está bien. La conexión estaba lenta o el servicio estaba ocupado.",
  retry: "Intentar de nuevo",
  backHome: "Volver al inicio",
  pdfTooBig: "Ese PDF es demasiado grande. Mejor tome una foto de la página.",
  backTo: (l) => `Volver a ${l}`,
};

const ko: Base = {
  appName: "Doc Deco",
  tagline: "어떤 서류든, 내 언어로 쉽게 설명해 드려요.",
  scan: "서류 촬영하기",
  upload: "사진 올리기",
  trySample: "예시로 해보기",
  sampleTicket: "주차 위반 딱지",
  sampleLetter: "공문서",
  sampleQuote: "공사 견적서",
  privacy: "사진은 절대 저장되지 않아요.",
  loading: ["서류를 읽고 있어요…", "어떤 서류인지 확인하고 있어요…", "문제가 있는지 살펴보고 있어요…", "할 일을 정리하고 있어요…"],
  docType: {
    parking_ticket: "🅿️ 주차 위반 딱지",
    official_letter: "✉️ 공문서",
    contractor_quote: "🔨 공사 견적서",
    other_document: "📄 서류",
    unreadable: "📷 읽기 어려움",
  },
  daysLeft: (n) => `${n}일 남음`,
  dueToday: "오늘 마감",
  dueTomorrow: "내일 마감",
  passed: (n) => `마감일이 ${n}일 지났어요`,
  noDeadline: "마감일이 없어요",
  deadlineUnknownDate: "마감일",
  scamTitle: { be_careful: "이 서류는 조심하세요", likely_scam: "사기일 수 있어요" },
  whatMeans: "무슨 뜻인가요",
  amountDue: "금액",
  from: "보낸 곳",
  whatToDo: "해야 할 일",
  tapToCheck: "끝낸 단계를 눌러 체크하세요.",
  contestStrength: "이 딱지에 이의를 제기할 수 있을까요?",
  strength: { strong: "가능성 높음", possible: "가능성 있음", weak: "가능성 낮음" },
  problemsFound: "딱지에서 발견된 문제",
  possibleGrounds: "그 밖에 확인할 것",
  letterReady: "이의 신청서가 준비됐어요",
  letterNote: "시에서 이의 신청을 영어로 처리하기 때문에 편지는 영어로 되어 있어요.",
  editBrackets: "보내기 전에 노란색 부분을 고치세요.",
  copy: "편지 복사",
  copied: "복사됨 ✓",
  email: "이메일로 보내기",
  emailSubject: "Request for initial review of parking citation",
  priceCheck: "적정한 가격인가요?",
  verdict: { good_deal: "좋은 가격", fair: "적정", high: "비쌈", very_high: "매우 비쌈" },
  aboveTypical: (n) => `보통보다 약 ${n}% 비쌈`,
  belowTypical: (n) => `보통보다 약 ${n}% 저렴`,
  aboutTypical: "보통 수준",
  quoted: "견적",
  typical: "보통 가격",
  estimates: "보통 가격은 LA 지역 기준 추정치예요.",
  lineItems: "항목별 확인",
  rating: { low: "저렴", fair: "적정", high: "비쌈", very_high: "매우 비쌈", unclear: "불명확" },
  noLicense: "이 견적서에는 면허 번호가 없어요",
  license: "면허",
  verifyAt: "확인:",
  askBefore: "서명하기 전에 이렇게 물어보세요",
  ifIgnored: "그냥 두면 생기는 일",
  redFlags: "주의할 점",
  lowConfidence: "일부 내용은 읽기 어려웠어요. 원본 서류와 다시 확인하세요.",
  disclaimer: "Doc Deco는 서류 이해를 돕는 앱이에요. 법률 자문이 아니에요.",
  scanAnother: "다른 서류 촬영",
  unreadableTitle: "이 사진은 읽을 수 없었어요",
  unreadableTips: ["종이를 탁자 위에 평평하게 놓으세요", "그림자 없이 밝은 곳에서 찍으세요", "페이지 전체가 사진에 나오게 하세요", "휴대폰을 위에서 똑바로, 흔들리지 않게 드세요"],
  tryAgain: "다시 찍기",
  errorTitle: "읽을 수 없었어요",
  errorBody: "밝은 곳에서 평평하게 놓고 더 선명하게 찍어 보세요.",
  translating: "번역 중…",
  translateFailed: "지금은 번역할 수 없어요. 이전 내용을 보여 드려요.",
  language: "언어",
  stillReading: "아직 읽는 중이에요. 보통 15~20초 걸려요.",
  serverErrorTitle: "처리를 끝내지 못했어요",
  serverErrorBody: "사진은 아마 괜찮아요. 연결이 느리거나 서비스가 바빴어요.",
  retry: "다시 시도",
  backHome: "처음으로",
  pdfTooBig: "PDF 파일이 너무 커요. 대신 페이지를 사진으로 찍어 주세요.",
  backTo: (l) => `${l}로 보기`,
};

const tl: Base = {
  appName: "Doc Deco",
  tagline: "Kahit anong papeles. Ipinaliwanag sa sarili mong wika.",
  scan: "I-scan ang dokumento",
  upload: "Mag-upload ng litrato",
  trySample: "Subukan ang halimbawa",
  sampleTicket: "Tiket sa paradahan",
  sampleLetter: "Sulat mula sa gobyerno",
  sampleQuote: "Quote ng kontratista",
  privacy: "Hindi kailanman sine-save ang litrato mo.",
  loading: [
    "Binabasa ang dokumento mo…",
    "Inaalam kung ano ito…",
    "Tinitingnan kung may problema…",
    "Isinusulat ang mga susunod mong hakbang…",
  ],
  docType: {
    parking_ticket: "🅿️ Tiket sa paradahan",
    official_letter: "✉️ Opisyal na sulat",
    contractor_quote: "🔨 Quote ng kontratista",
    other_document: "📄 Dokumento",
    unreadable: "📷 Mahirap basahin",
  },
  daysLeft: (n) => (n === 1 ? "1 araw na lang" : `${n} araw na lang`),
  dueToday: "Ngayong araw ang deadline",
  dueTomorrow: "Bukas ang deadline",
  passed: (n) => (n === 1 ? "Lampas na ang deadline nang 1 araw" : `Lampas na ang deadline nang ${n} araw`),
  noDeadline: "Walang nakitang deadline",
  deadlineUnknownDate: "Deadline",
  scamTitle: { be_careful: "Mag-ingat dito", likely_scam: "Baka scam ito" },
  whatMeans: "Ano ang ibig sabihin nito",
  amountDue: "Halaga",
  from: "Mula sa",
  whatToDo: "Ano ang gagawin",
  tapToCheck: "I-tap ang hakbang kapag tapos na.",
  contestStrength: "Puwede mo bang labanan ang tiket na ito?",
  strength: { strong: "Malakas na kaso", possible: "Posibleng kaso", weak: "Mahinang kaso" },
  problemsFound: "Mga problema sa tiket",
  possibleGrounds: "Iba pang dapat tingnan",
  letterReady: "Handa na ang sulat mo ng apela",
  letterNote: "Nasa Ingles ang sulat dahil sa Ingles pinoproseso ng lungsod ang mga apela.",
  editBrackets: "Baguhin ang mga dilaw na bahagi bago ipadala.",
  copy: "Kopyahin ang sulat",
  copied: "Nakopya ✓",
  email: "I-email",
  emailSubject: "Request for initial review of parking citation",
  priceCheck: "Patas ba ang presyo?",
  verdict: { good_deal: "Magandang presyo", fair: "Patas", high: "Mataas", very_high: "Napakataas" },
  aboveTypical: (n) => `~${n}% mas mataas sa karaniwan`,
  belowTypical: (n) => `~${n}% mas mababa sa karaniwan`,
  aboutTypical: "Halos karaniwan",
  quoted: "Presyo sa quote",
  typical: "Karaniwan",
  estimates: "Tantya lang ang karaniwang presyo para sa LA.",
  lineItems: "Isa-isa",
  rating: { low: "Mababa", fair: "Patas", high: "Mataas", very_high: "Napakataas", unclear: "Hindi malinaw" },
  noLicense: "Walang license number sa quote na ito",
  license: "Lisensya",
  verifyAt: "i-check sa",
  askBefore: "Itanong ito bago pumirma",
  ifIgnored: "Kung hindi mo ito papansinin",
  redFlags: "Mga dapat bantayan",
  lowConfidence: "May mga bahaging mahirap basahin. I-double check ang mga detalye sa dokumento mo.",
  disclaimer: "Tinutulungan ka ng Doc Deco na maintindihan ang mga dokumento. Hindi ito legal na payo.",
  scanAnother: "Mag-scan ng iba",
  unreadableTitle: "Hindi namin ito mabasa",
  unreadableTips: [
    "Ilatag nang patag ang papel sa mesa",
    "Gumamit ng maliwanag na ilaw, walang anino",
    "Dapat kita ang buong pahina sa litrato",
    "Hawakan nang steady at diretso sa itaas ang phone",
  ],
  tryAgain: "Kumuha ng bagong litrato",
  errorTitle: "Hindi mabasa",
  errorBody: "Subukan ang mas malinaw at patag na litrato na may magandang ilaw.",
  translating: "Isinasalin…",
  translateFailed: "Hindi maisalin ngayon. Ipinapakita ang huling bersyon.",
  language: "Wika",
  stillReading: "Binabasa pa rin… karaniwang 15–20 segundo ito.",
  serverErrorTitle: "Hindi namin ito natapos",
  serverErrorBody: "Malamang maayos ang litrato mo. Mabagal ang koneksyon o abala ang serbisyo.",
  retry: "Subukan ulit",
  backHome: "Bumalik sa simula",
  pdfTooBig: "Masyadong malaki ang PDF. Kunan na lang ng litrato ang pahina.",
  backTo: (l) => `Bumalik sa ${l}`,
};

type Base = Omit<Strings, keyof ExtraStrings>;

export const STRINGS: Record<Lang, Strings> = {
  en: { ...en, ...EXTRA.en },
  hy: { ...hy, ...EXTRA.hy },
  es: { ...es, ...EXTRA.es },
  ko: { ...ko, ...EXTRA.ko },
  tl: { ...tl, ...EXTRA.tl },
};
