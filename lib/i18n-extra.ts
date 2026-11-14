import type { Lang } from "./types";

export interface ExtraStrings {
  sampleScam: string;
  remindTitle: string;
  remindSub: string;
  google: string;
  apple: string;
  outlook: string;
  eventPrefix: string;
  share: string;
  shareSub: string;
  shareText: string;
  whatsapp: string;
  shareFooter: string;
  helpTitle: string;
  helpSub: string;
  call: string;
  website: string;
  numberMismatchTitle: (agency: string) => string;
  numberMismatchBody: (bad: string, official: string) => string;
  numberMatchTitle: (agency: string) => string;
  officialNumber: string;
  askTitle: string;
  askPlaceholder: string;
  askSend: string;
  askSuggestions: string[];
  askThinking: string;
  askError: string;
  readAloud: string;
  stopReading: string;
  stepsWord: string;
  dueWord: string;
}

export const EXTRA: Record<Lang, ExtraStrings> = {
  en: {
    sampleScam: "Suspicious letter",
    remindTitle: "Don't miss it",
    remindSub: "Add the deadline to your calendar, with reminders 3 days and 1 day before.",
    google: "Google",
    apple: "iPhone / Apple",
    outlook: "Outlook",
    eventPrefix: "Deadline",
    share: "Send to family",
    shareSub: "Let someone you trust help.",
    shareText: "Text it",
    whatsapp: "WhatsApp",
    shareFooter: "Explained by Explain It",
    helpTitle: "Free help near you",
    helpSub: "Real people who can help, for free.",
    call: "Call",
    website: "Website",
    numberMismatchTitle: (a) => `This phone number is NOT the official ${a} number`,
    numberMismatchBody: (bad, off) => `The letter says to call ${bad}. The real ${off}. Don't call the number on the letter.`,
    numberMatchTitle: (a) => `Phone number matches the official ${a} number`,
    officialNumber: "official number is",
    askTitle: "Ask a question",
    askPlaceholder: "Type your question…",
    askSend: "Ask",
    askSuggestions: ["Can I pay in parts?", "What if I miss the deadline?", "Who can I call for help?"],
    askThinking: "Thinking…",
    askError: "Couldn't answer right now. Try again.",
    readAloud: "Read it to me",
    stopReading: "Stop",
    stepsWord: "What to do",
    dueWord: "Deadline",
  },
  hy: {
    sampleScam: "Կասկածելի նամակ",
    remindTitle: "Մի բաց թողեք",
    remindSub: "Ավելացրեք վերջնաժամկետը ձեր օրացույցում՝ հիշեցումներով 3 օր և 1 օր առաջ։",
    google: "Google",
    apple: "iPhone / Apple",
    outlook: "Outlook",
    eventPrefix: "Վերջնաժամկետ",
    share: "Ուղարկել ընտանիքին",
    shareSub: "Թող ձեր վստահելի մարդը օգնի։",
    shareText: "SMS",
    whatsapp: "WhatsApp",
    shareFooter: "Բացատրված է Explain It-ով",
    helpTitle: "Անվճար օգնություն ձեր մոտ",
    helpSub: "Իրական մարդիկ, որոնք կարող են անվճար օգնել։",
    call: "Զանգել",
    website: "Կայք",
    numberMismatchTitle: (a) => `Այս հեռախոսահամարը ${a}-ի պաշտոնական համարը ՉԷ`,
    numberMismatchBody: (bad, off) => `Նամակում ասված է զանգել ${bad}։ Իսկական ${off}։ Մի զանգեք նամակի համարով։`,
    numberMatchTitle: (a) => `Հեռախոսահամարը համընկնում է ${a}-ի պաշտոնական համարի հետ`,
    officialNumber: "պաշտոնական համարն է",
    askTitle: "Հարց տվեք",
    askPlaceholder: "Գրեք ձեր հարցը…",
    askSend: "Հարցնել",
    askSuggestions: ["Կարո՞ղ եմ մաս-մաս վճարել։", "Ի՞նչ կլինի, եթե ուշանամ։", "Ու՞մ կարող եմ զանգել օգնության համար։"],
    askThinking: "Մտածում ենք…",
    askError: "Հիմա չհաջողվեց պատասխանել։ Փորձեք կրկին։",
    readAloud: "Կարդալ բարձրաձայն",
    stopReading: "Կանգնեցնել",
    stepsWord: "Ինչ անել",
    dueWord: "Վերջնաժամկետ",
  },
  es: {
    sampleScam: "Carta sospechosa",
    remindTitle: "No lo olvide",
    remindSub: "Agregue la fecha límite a su calendario, con recordatorios 3 días y 1 día antes.",
    google: "Google",
    apple: "iPhone / Apple",
    outlook: "Outlook",
    eventPrefix: "Fecha límite",
    share: "Enviar a la familia",
    shareSub: "Deje que alguien de confianza le ayude.",
    shareText: "Mensaje",
    whatsapp: "WhatsApp",
    shareFooter: "Explicado por Explain It",
    helpTitle: "Ayuda gratis cerca de usted",
    helpSub: "Personas reales que pueden ayudarle gratis.",
    call: "Llamar",
    website: "Sitio web",
    numberMismatchTitle: (a) => `Este teléfono NO es el número oficial de ${a}`,
    numberMismatchBody: (bad, off) => `La carta dice que llame al ${bad}. El ${off}. No llame al número de la carta.`,
    numberMatchTitle: (a) => `El teléfono coincide con el número oficial de ${a}`,
    officialNumber: "número oficial es el",
    askTitle: "Haga una pregunta",
    askPlaceholder: "Escriba su pregunta…",
    askSend: "Preguntar",
    askSuggestions: ["¿Puedo pagar en partes?", "¿Qué pasa si no llego a tiempo?", "¿A quién llamo para pedir ayuda?"],
    askThinking: "Pensando…",
    askError: "No se pudo responder ahora. Intente otra vez.",
    readAloud: "Léamelo",
    stopReading: "Parar",
    stepsWord: "Qué hacer",
    dueWord: "Fecha límite",
  },
  ko: {
    sampleScam: "수상한 편지",
    remindTitle: "놓치지 마세요",
    remindSub: "마감일을 달력에 추가하고 3일 전, 1일 전에 알림을 받으세요.",
    google: "Google",
    apple: "iPhone / Apple",
    outlook: "Outlook",
    eventPrefix: "마감일",
    share: "가족에게 보내기",
    shareSub: "믿을 수 있는 사람에게 도움을 받으세요.",
    shareText: "문자",
    whatsapp: "WhatsApp",
    shareFooter: "Explain It이 설명했어요",
    helpTitle: "가까운 무료 도움",
    helpSub: "무료로 도와줄 수 있는 실제 기관이에요.",
    call: "전화",
    website: "웹사이트",
    numberMismatchTitle: (a) => `이 전화번호는 ${a}의 공식 번호가 아니에요`,
    numberMismatchBody: (bad, off) => `편지에는 ${bad}로 전화하라고 되어 있어요. 실제 ${off}. 편지에 적힌 번호로 전화하지 마세요.`,
    numberMatchTitle: (a) => `전화번호가 ${a}의 공식 번호와 일치해요`,
    officialNumber: "공식 번호는",
    askTitle: "질문하기",
    askPlaceholder: "질문을 입력하세요…",
    askSend: "질문",
    askSuggestions: ["나눠서 낼 수 있나요?", "마감일을 놓치면 어떻게 되나요?", "누구에게 도움을 요청할 수 있나요?"],
    askThinking: "생각 중…",
    askError: "지금은 답할 수 없어요. 다시 시도해 주세요.",
    readAloud: "읽어 주세요",
    stopReading: "멈추기",
    stepsWord: "해야 할 일",
    dueWord: "마감일",
  },
  tl: {
    sampleScam: "Kahina-hinalang sulat",
    remindTitle: "Huwag itong makalimutan",
    remindSub: "Idagdag ang deadline sa kalendaryo mo, may paalala 3 araw at 1 araw bago.",
    google: "Google",
    apple: "iPhone / Apple",
    outlook: "Outlook",
    eventPrefix: "Deadline",
    share: "Ipadala sa pamilya",
    shareSub: "Hayaang tumulong ang taong pinagkakatiwalaan mo.",
    shareText: "I-text",
    whatsapp: "WhatsApp",
    shareFooter: "Ipinaliwanag ng Explain It",
    helpTitle: "Libreng tulong malapit sa iyo",
    helpSub: "Mga totoong taong makakatulong nang libre.",
    call: "Tumawag",
    website: "Website",
    numberMismatchTitle: (a) => `HINDI ito ang opisyal na numero ng ${a}`,
    numberMismatchBody: (bad, off) => `Sabi ng sulat, tumawag sa ${bad}. Ang totoong ${off}. Huwag tawagan ang numero sa sulat.`,
    numberMatchTitle: (a) => `Tugma ang numero sa opisyal na numero ng ${a}`,
    officialNumber: "opisyal na numero ay",
    askTitle: "Magtanong",
    askPlaceholder: "I-type ang tanong mo…",
    askSend: "Itanong",
    askSuggestions: ["Puwede ko bang hulugan?", "Paano kung lumampas ako sa deadline?", "Sino ang puwede kong tawagan?"],
    askThinking: "Nag-iisip…",
    askError: "Hindi makasagot ngayon. Subukan ulit.",
    readAloud: "Basahin para sa akin",
    stopReading: "Ihinto",
    stepsWord: "Ano ang gagawin",
    dueWord: "Deadline",
  },
};
