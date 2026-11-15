import type { Lang, SampleId } from "./types";

/* Text for the home (landing) screen, in all five languages. The app's own screens use lib/i18n.ts. */

interface Feat {
  title: string;
  body: string;
  cta: string;
}

export interface LandingStrings {
  nav: { how: string; try: string; help: string; faq: string };
  h1: string;
  lede: string;
  readIn: string;
  free: string;
  mock: {
    doc: string;
    strong: string;
    today: string;
    mistakes: string;
    mistakesSub: string;
    step1: string;
    step2: string;
    letter: string;
    letterSub: string;
    ready: string;
  };
  tryTitle: string;
  trySub: string;
  sampleDesc: Record<SampleId, string>;
  moreTitle: string;
  mailTitle: string;
  types: [string, string, string, string, string];
  feats: [Feat, Feat, Feat, Feat];
  card: {
    backTaxes: string;
    fromIrs: string;
    scamQ: string;
    high: string;
    lateFee: string;
    addCal: string;
    reading: string;
    letterSays: string;
    realIrs: string;
    giftCards: string;
    stepCar: string;
  };
  allTitle: string;
  allSub: string;
  all: { title: string; body: string }[];
  helpTitle: string;
  helpSub: string;
  helpAll: string;
  faqTitle: string;
  faqSub: string;
  faqCall: string;
  faq: { q: string; a: string }[];
  ctaTitle: string;
  ctaBody: string;
  footAbout: string;
  footMade: string;
}

const en: LandingStrings = {
  nav: { how: "How it works", try: "Try a sample", help: "Free help", faq: "Questions" },
  h1: "Your letters, explained in your language",
  lede: "Take a photo. We tell you what it is, the day it’s due and exactly what to do next.",
  readIn: "Read it in",
  free: "Free, with no account",
  mock: {
    doc: "Parking ticket",
    strong: "Strong case",
    today: "Today",
    mistakes: "2 mistakes found",
    mistakesSub: "HONDA on the ticket, a Toyota Camry in the notes.",
    step1: "Check the street signs",
    step2: "Send the appeal letter",
    letter: "Your appeal, written.",
    letterSub: "In English for the city, explained in your language.",
    ready: "Ready to send",
  },
  tryTitle: "Try one of ours",
  trySub: "Four sample letters. Tap one and watch it get read.",
  sampleDesc: {
    ticket: "Two mistakes found, a strong case, and the appeal letter written for you.",
    letter: "A jury summons: 10 days to respond, and the court’s real number.",
    quote: "About 31% above typical for the area, no license number, a 40% deposit.",
    scam: "The phone number isn’t the real IRS. The real one, and what to do instead.",
  },
  moreTitle: "More ways we help",
  mailTitle: "Made for the mail that worries people",
  types: ["Parking tickets", "Court and jury letters", "Tax and government letters", "Utility notices", "Contractor quotes"],
  feats: [
    {
      title: "Know what your letter says",
      body: "Take a photo of a ticket, a court letter, a bill or a quote. In about 15 seconds you get the short version in your language: what it is, who sent it and what it costs.",
      cta: "Try the court letter",
    },
    {
      title: "Never miss the deadline",
      body: "It finds the date that matters, counts the days and puts it in your calendar with one tap. You see the late fee before it lands.",
      cta: "Try the parking ticket",
    },
    {
      title: "Get the next step done",
      body: "Steps you can tick off, the appeal letter written for you in English, and the real number to call. Hear it read aloud, or send it to family.",
      cta: "See the steps",
    },
    {
      title: "Spot a scam before you pay",
      body: "It looks for gift-card demands, threats of arrest and phone numbers that don’t match the real agency, then shows you the real one.",
      cta: "Try the suspicious letter",
    },
  ],
  card: {
    backTaxes: "Back taxes notice",
    fromIrs: "Says it’s from the IRS",
    scamQ: "Scam?",
    high: "31% high",
    lateFee: "After Nov 30: +$73 late fee",
    addCal: "Add to calendar",
    reading: "Reading it to you",
    letterSays: "The letter says call",
    realIrs: "The real IRS:",
    giftCards: "The IRS never asks for gift cards.",
    stepCar: "Check your car and your photos",
  },
  allTitle: "Everything from one photo",
  allSub: "No account and nothing to install. It opens in your phone’s browser.",
  all: [
    { title: "Five languages", body: "English, Armenian, Spanish, Korean and Tagalog. Switch any time without a new photo." },
    { title: "Deadline countdown", body: "The date that matters, the days left and a calendar reminder." },
    { title: "Mistake check", body: "Finds errors on tickets that can get them thrown out." },
    { title: "Appeal letter", body: "Written for you in English, ready to edit and send." },
    { title: "Read it to me", body: "Every explanation can be read out loud." },
    { title: "Send to family", body: "A link or a text with the summary and the steps." },
    { title: "Quote check", body: "Compares a contractor’s price with what’s typical nearby." },
    { title: "Scam check", body: "Flags fake agencies and shows you the real phone number." },
  ],
  helpTitle: "Free help, close to home",
  helpSub: "Doc Deco isn’t a lawyer. When you need a person, these lines are free.",
  helpAll: "More Glendale help lines",
  faqTitle: "Questions people ask first",
  faqSub: "Your photo is read once to write your explanation, then it’s gone. There’s no account to make.",
  faqCall: "Still unsure? Dial 2-1-1",
  faq: [
    { q: "Is it really free?", a: "Yes. No account, no subscription and no ads." },
    {
      q: "Is this legal advice?",
      a: "No. It explains your paper in plain words and lists the steps. For advice, it points you to free local help.",
    },
    {
      q: "What kinds of papers work?",
      a: "Parking tickets, court and jury letters, tax and government letters, utility notices, and contractor or repair quotes.",
    },
    { q: "What happens to my photo?", a: "It’s read once to write your explanation and is never stored." },
    {
      q: "Why is the appeal letter in English?",
      a: "Because the city handles appeals in English. Everything around it is in your language.",
    },
    {
      q: "What does it get wrong?",
      a: "It can misread a smudged number. Parts it isn’t sure of are flagged, so check them against your paper.",
    },
  ],
  ctaTitle: "Bring the scary one.",
  ctaBody: "The letter you’ve been avoiding takes about a minute. Free, and your photo is never saved.",
  footAbout: "Doc Deco reads official mail with you, in your language, and hands you the next step.",
  footMade: "Made for the Glendale hackathon.",
};

const hy: LandingStrings = {
  nav: { how: "Ինչպես է աշխատում", try: "Փորձել օրինակ", help: "Անվճար օգնություն", faq: "Հարցեր" },
  h1: "Ձեր նամակները՝ բացատրված ձեր լեզվով",
  lede: "Լուսանկարեք։ Կասենք՝ ինչ է դա, երբ է վերջնաժամկետը և ինչ անել հետո։",
  readIn: "Կարդալ՝",
  free: "Անվճար, առանց հաշվի",
  mock: {
    doc: "Կայանման տուգանք",
    strong: "Ուժեղ փաստարկ",
    today: "Այսօր",
    mistakes: "Գտնվել է 2 սխալ",
    mistakesSub: "Տուգանքում՝ HONDA, նշումներում՝ Toyota Camry։",
    step1: "Ստուգեք ցուցանակները",
    step2: "Ուղարկեք բողոքի նամակը",
    letter: "Բողոքը՝ գրված։",
    letterSub: "Անգլերեն՝ քաղաքի համար, բացատրված՝ ձեր լեզվով։",
    ready: "Պատրաստ է",
  },
  tryTitle: "Փորձեք մեր օրինակները",
  trySub: "Չորս օրինակ նամակ։ Սեղմեք մեկը և տեսեք, թե ինչպես է այն կարդացվում։",
  sampleDesc: {
    ticket: "Գտնվել է երկու սխալ, փաստարկը ուժեղ է, և բողոքի նամակն արդեն գրված է։",
    letter: "Երդվյալ ատենակալի կանչ՝ 10 օր պատասխանելու համար, և դատարանի իսկական համարը։",
    quote: "Մոտ 31%-ով թանկ է սովորականից, լիցենզիայի համար չկա, 40% կանխավճար։",
    scam: "Հեռախոսահամարը իսկական IRS-ինը չէ։ Իսկական համարը և ինչ անել։",
  },
  moreTitle: "Օգնության այլ ձևեր",
  mailTitle: "Ստեղծված է անհանգստացնող նամակների համար",
  types: ["Կայանման տուգանքներ", "Դատարանի նամակներ", "Հարկային և պետական նամակներ", "Կոմունալ ծանուցումներ", "Կապալառուների գնահատականներ"],
  feats: [
    {
      title: "Իմացեք, թե ինչ է գրված նամակում",
      body: "Լուսանկարեք տուգանքը, դատարանի նամակը, հաշիվը կամ գնահատականը։ Մոտ 15 վայրկյանում կստանաք կարճ բացատրություն ձեր լեզվով՝ ինչ է դա, ով է ուղարկել և ինչ արժե։",
      cta: "Փորձել դատարանի նամակը",
    },
    {
      title: "Երբեք բաց մի թողեք վերջնաժամկետը",
      body: "Գտնում է կարևոր ամսաթիվը, հաշվում օրերը և մեկ հպումով ավելացնում օրացույցում։ Տույժի մասին կիմանաք նախապես։",
      cta: "Փորձել կայանման տուգանքը",
    },
    {
      title: "Կատարեք հաջորդ քայլը",
      body: "Քայլեր, որոնք կարող եք նշել, անգլերեն գրված բողոքի նամակ և զանգելու իսկական համարը։ Լսեք բարձրաձայն կամ ուղարկեք ընտանիքին։",
      cta: "Տեսնել քայլերը",
    },
    {
      title: "Ճանաչեք խարդախությունը՝ նախքան վճարելը",
      body: "Ստուգում է նվեր-քարտերի պահանջները, ձերբակալման սպառնալիքները և կեղծ հեռախոսահամարները, ապա ցույց է տալիս իսկականը։",
      cta: "Փորձել կասկածելի նամակը",
    },
  ],
  card: {
    backTaxes: "Հարկային պարտքի ծանուցում",
    fromIrs: "Իբր IRS-ից է",
    scamQ: "Խարդախությո՞ւն",
    high: "31% թանկ",
    lateFee: "Նոյեմբերի 30-ից հետո՝ +$73 տույժ",
    addCal: "Ավելացնել օրացույցում",
    reading: "Կարդում է ձեզ համար",
    letterSays: "Նամակում գրված է զանգել",
    realIrs: "Իսկական IRS-ը՝",
    giftCards: "IRS-ը երբեք նվեր-քարտ չի պահանջում։",
    stepCar: "Ստուգեք մեքենան և լուսանկարները",
  },
  allTitle: "Ամեն ինչ մեկ լուսանկարից",
  allSub: "Ոչ հաշիվ, ոչ տեղադրում։ Բացվում է ձեր հեռախոսի բրաուզերում։",
  all: [
    { title: "Հինգ լեզու", body: "Անգլերեն, հայերեն, իսպաներեն, կորեերեն և տագալոգ։ Փոխեք ցանկացած պահի՝ առանց նոր լուսանկարի։" },
    { title: "Վերջնաժամկետի հաշվարկ", body: "Կարևոր ամսաթիվը, մնացած օրերը և հիշեցում օրացույցում։" },
    { title: "Սխալների ստուգում", body: "Գտնում է տուգանքի սխալներ, որոնց պատճառով այն կարող է չեղարկվել։" },
    { title: "Բողոքի նամակ", body: "Գրված է ձեզ համար անգլերեն, պատրաստ խմբագրելու և ուղարկելու։" },
    { title: "Կարդալ ինձ համար", body: "Ցանկացած բացատրություն կարելի է լսել բարձրաձայն։" },
    { title: "Ուղարկել ընտանիքին", body: "Հղում կամ հաղորդագրություն՝ ամփոփումով և քայլերով։" },
    { title: "Գնի ստուգում", body: "Համեմատում է կապալառուի գինը մոտակայքի սովորական գների հետ։" },
    { title: "Խարդախության ստուգում", body: "Նշում է կեղծ կազմակերպությունները և ցույց տալիս իսկական համարը։" },
  ],
  helpTitle: "Անվճար օգնություն՝ մոտակայքում",
  helpSub: "Doc Deco-ն փաստաբան չէ։ Երբ մարդու կարիք ունեք, այս գծերն անվճար են։",
  helpAll: "Գլենդեյլի բոլոր օգնության համարները",
  faqTitle: "Հաճախ տրվող հարցեր",
  faqSub: "Ձեր լուսանկարը կարդացվում է մեկ անգամ՝ բացատրությունը գրելու համար, ապա ջնջվում։ Հաշիվ ստեղծել պետք չէ։",
  faqCall: "Վստահ չե՞ք։ Զանգեք 2-1-1",
  faq: [
    { q: "Իսկապե՞ս անվճար է։", a: "Այո։ Ոչ հաշիվ, ոչ բաժանորդագրություն, ոչ գովազդ։" },
    {
      q: "Սա իրավաբանական խորհո՞ւրդ է։",
      a: "Ոչ։ Այն բացատրում է ձեր թուղթը պարզ բառերով և թվարկում քայլերը։ Խորհրդի համար ուղղորդում է անվճար տեղական օգնության։",
    },
    {
      q: "Ինչպիսի՞ թղթեր են աշխատում։",
      a: "Կայանման տուգանքներ, դատարանի և երդվյալների նամակներ, հարկային և պետական նամակներ, կոմունալ ծանուցումներ և կապալառուների գնահատականներ։",
    },
    { q: "Ի՞նչ է լինում իմ լուսանկարի հետ։", a: "Այն կարդացվում է մեկ անգամ՝ բացատրությունը գրելու համար, և երբեք չի պահվում։" },
    {
      q: "Ինչո՞ւ է բողոքի նամակն անգլերեն։",
      a: "Որովհետև քաղաքը բողոքներն ընդունում է անգլերեն։ Մնացած ամեն ինչ ձեր լեզվով է։",
    },
    {
      q: "Ի՞նչ կարող է սխալ լինել։",
      a: "Կարող է սխալ կարդալ աղոտ թիվը։ Անվստահ մասերը նշվում են, ուստի համեմատեք դրանք ձեր թղթի հետ։",
    },
  ],
  ctaTitle: "Բերեք ամենասարսափելին։",
  ctaBody: "Այն նամակը, որից խուսափում եք, մոտ մեկ րոպե կտևի։ Անվճար է, և ձեր լուսանկարը երբեք չի պահվում։",
  footAbout: "Doc Deco-ն կարդում է պաշտոնական նամակները ձեզ հետ՝ ձեր լեզվով, և ցույց տալիս հաջորդ քայլը։",
  footMade: "Ստեղծված է Գլենդեյլի հաքաթոնի համար։",
};

const es: LandingStrings = {
  nav: { how: "Cómo funciona", try: "Probar un ejemplo", help: "Ayuda gratis", faq: "Preguntas" },
  h1: "Sus cartas, explicadas en su idioma",
  lede: "Tómele una foto. Le decimos qué es, cuándo vence y qué hacer después.",
  readIn: "Leer en",
  free: "Gratis y sin cuenta",
  mock: {
    doc: "Multa de estacionamiento",
    strong: "Caso fuerte",
    today: "Hoy",
    mistakes: "2 errores encontrados",
    mistakesSub: "HONDA en la multa, un Toyota Camry en las notas.",
    step1: "Revise las señales de la calle",
    step2: "Envíe la carta de apelación",
    letter: "Su apelación, escrita.",
    letterSub: "En inglés para la ciudad, explicada en su idioma.",
    ready: "Lista para enviar",
  },
  tryTitle: "Pruebe uno de los nuestros",
  trySub: "Cuatro cartas de ejemplo. Toque una y vea cómo se lee.",
  sampleDesc: {
    ticket: "Dos errores encontrados, un caso fuerte y la carta de apelación escrita para usted.",
    letter: "Una citación de jurado: 10 días para responder y el número real de la corte.",
    quote: "Cerca de 31% más caro de lo normal, sin número de licencia y 40% de anticipo.",
    scam: "El teléfono no es del IRS real. El número verdadero y qué hacer.",
  },
  moreTitle: "Más formas de ayudar",
  mailTitle: "Hecho para el correo que preocupa",
  types: ["Multas de estacionamiento", "Cartas de la corte y jurado", "Cartas de impuestos y del gobierno", "Avisos de servicios", "Presupuestos de contratistas"],
  feats: [
    {
      title: "Sepa qué dice su carta",
      body: "Tómele una foto a una multa, una carta de la corte, una factura o un presupuesto. En unos 15 segundos recibe la versión corta en su idioma: qué es, quién la envía y cuánto cuesta.",
      cta: "Probar la carta de la corte",
    },
    {
      title: "Nunca pierda una fecha límite",
      body: "Encuentra la fecha importante, cuenta los días y la pone en su calendario con un toque. Ve el recargo antes de que llegue.",
      cta: "Probar la multa",
    },
    {
      title: "Haga el siguiente paso",
      body: "Pasos que puede marcar, la carta de apelación escrita en inglés y el número real para llamar. Escúchelo en voz alta o envíelo a su familia.",
      cta: "Ver los pasos",
    },
    {
      title: "Detecte una estafa antes de pagar",
      body: "Busca pedidos de tarjetas de regalo, amenazas de arresto y teléfonos que no son de la agencia real, y le muestra el verdadero.",
      cta: "Probar la carta sospechosa",
    },
  ],
  card: {
    backTaxes: "Aviso de impuestos atrasados",
    fromIrs: "Dice que es del IRS",
    scamQ: "¿Estafa?",
    high: "31% más caro",
    lateFee: "Después del 30 de nov.: +$73 de recargo",
    addCal: "Agregar al calendario",
    reading: "Leyéndoselo",
    letterSays: "La carta dice que llame al",
    realIrs: "El IRS real:",
    giftCards: "El IRS nunca pide tarjetas de regalo.",
    stepCar: "Revise su carro y sus fotos",
  },
  allTitle: "Todo con una sola foto",
  allSub: "Sin cuenta y sin instalar nada. Se abre en el navegador de su teléfono.",
  all: [
    { title: "Cinco idiomas", body: "Inglés, armenio, español, coreano y tagalo. Cambie cuando quiera sin otra foto." },
    { title: "Cuenta regresiva", body: "La fecha importante, los días que quedan y un recordatorio en el calendario." },
    { title: "Revisión de errores", body: "Encuentra errores en multas que pueden anularlas." },
    { title: "Carta de apelación", body: "Escrita en inglés para usted, lista para editar y enviar." },
    { title: "Léamelo", body: "Cada explicación se puede escuchar en voz alta." },
    { title: "Enviar a la familia", body: "Un enlace o un mensaje con el resumen y los pasos." },
    { title: "Revisión de precios", body: "Compara el precio de un contratista con lo normal en su zona." },
    { title: "Revisión de estafas", body: "Señala agencias falsas y le muestra el número real." },
  ],
  helpTitle: "Ayuda gratis, cerca de casa",
  helpSub: "Doc Deco no es un abogado. Cuando necesite a una persona, estas líneas son gratis.",
  helpAll: "Ver todos los números de ayuda de Glendale",
  faqTitle: "Preguntas frecuentes",
  faqSub: "Su foto se lee una vez para escribir la explicación y luego desaparece. No hay que crear una cuenta.",
  faqCall: "¿Tiene dudas? Llame al 2-1-1",
  faq: [
    { q: "¿De verdad es gratis?", a: "Sí. Sin cuenta, sin suscripción y sin anuncios." },
    {
      q: "¿Es asesoría legal?",
      a: "No. Explica su papel en palabras sencillas y le da los pasos. Para asesoría, le indica ayuda local gratuita.",
    },
    {
      q: "¿Qué papeles funcionan?",
      a: "Multas de estacionamiento, cartas de la corte y de jurado, cartas de impuestos y del gobierno, avisos de servicios y presupuestos de contratistas.",
    },
    { q: "¿Qué pasa con mi foto?", a: "Se lee una vez para escribir su explicación y nunca se guarda." },
    {
      q: "¿Por qué la carta de apelación está en inglés?",
      a: "Porque la ciudad tramita las apelaciones en inglés. Todo lo demás está en su idioma.",
    },
    {
      q: "¿En qué se puede equivocar?",
      a: "Puede leer mal un número borroso. Lo que no es seguro se marca, así que compárelo con su papel.",
    },
  ],
  ctaTitle: "Traiga la que le da miedo.",
  ctaBody: "La carta que ha estado evitando toma un minuto. Es gratis y su foto nunca se guarda.",
  footAbout: "Doc Deco lee el correo oficial con usted, en su idioma, y le indica el siguiente paso.",
  footMade: "Hecho para el hackathon de Glendale.",
};

const ko: LandingStrings = {
  nav: { how: "사용 방법", try: "예시 보기", help: "무료 도움", faq: "자주 묻는 질문" },
  h1: "어려운 편지, 내 언어로 쉽게",
  lede: "사진을 찍으세요. 무엇인지, 언제까지인지, 다음에 무엇을 할지 알려 드려요.",
  readIn: "언어",
  free: "무료, 가입 필요 없음",
  mock: {
    doc: "주차 딱지",
    strong: "유리한 상황",
    today: "오늘",
    mistakes: "실수 2개 발견",
    mistakesSub: "딱지에는 HONDA, 메모에는 Toyota Camry.",
    step1: "도로 표지판 확인하기",
    step2: "이의 신청서 보내기",
    letter: "이의 신청서 작성 완료.",
    letterSub: "시청에는 영어로, 설명은 내 언어로.",
    ready: "보낼 준비 완료",
  },
  tryTitle: "예시로 해 보세요",
  trySub: "예시 편지 4개. 하나를 누르면 읽어 주는 과정을 볼 수 있어요.",
  sampleDesc: {
    ticket: "실수 2개 발견, 유리한 상황, 이의 신청서까지 써 드려요.",
    letter: "배심원 소환장: 답변 기한 10일, 법원의 진짜 번호.",
    quote: "이 지역 보통 가격보다 약 31% 비싸고, 면허 번호가 없고, 선금이 40%예요.",
    scam: "전화번호가 진짜 IRS 번호가 아니에요. 진짜 번호와 해야 할 일.",
  },
  moreTitle: "다른 도움",
  mailTitle: "걱정되는 우편물을 위해 만들었어요",
  types: ["주차 딱지", "법원·배심원 편지", "세금·정부 편지", "공과금 안내", "시공 견적서"],
  feats: [
    {
      title: "편지 내용을 알아보세요",
      body: "딱지, 법원 편지, 청구서, 견적서를 찍으세요. 약 15초 만에 내 언어로 짧게 알려 드려요: 무엇인지, 누가 보냈는지, 얼마인지.",
      cta: "법원 편지 예시 보기",
    },
    {
      title: "기한을 놓치지 마세요",
      body: "중요한 날짜를 찾아 남은 날을 세고, 한 번 누르면 달력에 넣어 드려요. 연체료가 붙기 전에 알 수 있어요.",
      cta: "주차 딱지 예시 보기",
    },
    {
      title: "다음 할 일을 끝내세요",
      body: "체크할 수 있는 단계, 영어로 써 드리는 이의 신청서, 전화할 진짜 번호. 소리 내어 들으시거나 가족에게 보내세요.",
      cta: "단계 보기",
    },
    {
      title: "돈 내기 전에 사기를 알아채세요",
      body: "기프트 카드 요구, 체포 협박, 진짜 기관과 다른 전화번호를 찾아내고 진짜 번호를 알려 드려요.",
      cta: "의심스러운 편지 예시 보기",
    },
  ],
  card: {
    backTaxes: "체납 세금 안내",
    fromIrs: "IRS라고 주장함",
    scamQ: "사기?",
    high: "31% 비쌈",
    lateFee: "11월 30일 이후: 연체료 +$73",
    addCal: "달력에 추가",
    reading: "읽어 드리는 중",
    letterSays: "편지에 적힌 번호",
    realIrs: "진짜 IRS:",
    giftCards: "IRS는 절대 기프트 카드를 요구하지 않아요.",
    stepCar: "차와 사진 확인하기",
  },
  allTitle: "사진 한 장으로 모두",
  allSub: "가입도 설치도 필요 없어요. 휴대폰 브라우저에서 바로 열려요.",
  all: [
    { title: "5개 언어", body: "영어, 아르메니아어, 스페인어, 한국어, 타갈로그어. 사진을 다시 찍지 않고 언제든 바꿀 수 있어요." },
    { title: "기한 카운트다운", body: "중요한 날짜, 남은 날, 달력 알림." },
    { title: "실수 확인", body: "딱지를 취소시킬 수 있는 실수를 찾아요." },
    { title: "이의 신청서", body: "영어로 써 드려요. 고쳐서 바로 보낼 수 있어요." },
    { title: "읽어 주기", body: "모든 설명을 소리 내어 들을 수 있어요." },
    { title: "가족에게 보내기", body: "요약과 단계를 링크나 문자로 보내요." },
    { title: "견적 확인", body: "시공업자 가격을 이 지역 보통 가격과 비교해요." },
    { title: "사기 확인", body: "가짜 기관을 알려 주고 진짜 전화번호를 보여 드려요." },
  ],
  helpTitle: "가까운 무료 도움",
  helpSub: "Doc Deco는 변호사가 아니에요. 사람이 필요할 때 이 번호들은 무료예요.",
  helpAll: "글렌데일 도움 번호 모두 보기",
  faqTitle: "자주 묻는 질문",
  faqSub: "사진은 설명을 쓰기 위해 한 번만 읽고 바로 사라져요. 가입할 필요도 없어요.",
  faqCall: "잘 모르겠다면 2-1-1에 전화하세요",
  faq: [
    { q: "정말 무료인가요?", a: "네. 가입, 구독, 광고가 없어요." },
    {
      q: "법률 조언인가요?",
      a: "아니요. 서류를 쉬운 말로 설명하고 할 일을 알려 드려요. 조언이 필요하면 무료 지역 도움을 안내해 드려요.",
    },
    { q: "어떤 서류가 되나요?", a: "주차 딱지, 법원·배심원 편지, 세금·정부 편지, 공과금 안내, 시공·수리 견적서." },
    { q: "제 사진은 어떻게 되나요?", a: "설명을 쓰기 위해 한 번 읽고, 절대 저장하지 않아요." },
    {
      q: "이의 신청서는 왜 영어인가요?",
      a: "시청이 이의 신청을 영어로 처리하기 때문이에요. 나머지는 모두 내 언어로 보여 드려요.",
    },
    {
      q: "틀릴 수도 있나요?",
      a: "흐린 숫자를 잘못 읽을 수 있어요. 확실하지 않은 부분은 표시하니 원래 서류와 비교해 보세요.",
    },
  ],
  ctaTitle: "제일 걱정되는 편지를 가져오세요.",
  ctaBody: "미뤄 둔 편지도 1분이면 돼요. 무료이고 사진은 절대 저장되지 않아요.",
  footAbout: "Doc Deco는 공식 우편물을 내 언어로 함께 읽고 다음 할 일을 알려 드려요.",
  footMade: "글렌데일 해커톤을 위해 만들었어요.",
};

const tl: LandingStrings = {
  nav: { how: "Paano ito gumagana", try: "Subukan ang halimbawa", help: "Libreng tulong", faq: "Mga tanong" },
  h1: "Ang mga sulat mo, ipinaliwanag sa sarili mong wika",
  lede: "Kunan ng litrato. Sasabihin namin kung ano ito, kailan ang deadline at ano ang gagawin.",
  readIn: "Basahin sa",
  free: "Libre, walang account",
  mock: {
    doc: "Tiket sa paradahan",
    strong: "Malakas na kaso",
    today: "Ngayon",
    mistakes: "2 mali ang nakita",
    mistakesSub: "HONDA sa tiket, Toyota Camry sa tala.",
    step1: "Tingnan ang mga karatula sa kalye",
    step2: "Ipadala ang sulat ng apela",
    letter: "Nakasulat na ang apela mo.",
    letterSub: "Sa Ingles para sa lungsod, ipinaliwanag sa sarili mong wika.",
    ready: "Handa nang ipadala",
  },
  tryTitle: "Subukan ang isa sa amin",
  trySub: "Apat na halimbawang sulat. Pindutin ang isa at panoorin kung paano ito binabasa.",
  sampleDesc: {
    ticket: "Dalawang mali ang nakita, malakas na kaso, at nakasulat na ang sulat ng apela para sa iyo.",
    letter: "Patawag sa jury: 10 araw para sumagot, at ang tunay na numero ng korte.",
    quote: "Mga 31% na mas mahal kaysa karaniwan sa lugar, walang numero ng lisensya, 40% na paunang bayad.",
    scam: "Hindi sa tunay na IRS ang numero ng telepono. Ang tunay na numero, at ano ang gagawin.",
  },
  moreTitle: "Iba pang tulong",
  mailTitle: "Ginawa para sa mga sulat na nakakapag-alala",
  types: ["Tiket sa paradahan", "Sulat ng korte at jury", "Sulat tungkol sa buwis at gobyerno", "Abiso sa utilities", "Quote ng kontratista"],
  feats: [
    {
      title: "Alamin ang sinasabi ng sulat mo",
      body: "Kunan ng litrato ang tiket, sulat ng korte, bill o quote. Sa mga 15 segundo, makukuha mo ang maikling bersyon sa sarili mong wika: ano ito, sino ang nagpadala at magkano.",
      cta: "Subukan ang sulat ng korte",
    },
    {
      title: "Huwag palampasin ang deadline",
      body: "Hinahanap nito ang mahalagang petsa, binibilang ang mga araw at inilalagay sa kalendaryo mo sa isang pindot. Makikita mo ang multa bago ito dumating.",
      cta: "Subukan ang tiket sa paradahan",
    },
    {
      title: "Gawin ang susunod na hakbang",
      body: "Mga hakbang na puwede mong i-tsek, ang sulat ng apela na nakasulat sa Ingles, at ang tunay na numerong tatawagan. Pakinggan nang malakas, o ipadala sa pamilya.",
      cta: "Tingnan ang mga hakbang",
    },
    {
      title: "Makita ang scam bago magbayad",
      body: "Hinahanap nito ang paghingi ng gift card, banta ng pag-aresto at mga numerong hindi tugma sa tunay na ahensya, saka ipinapakita ang tunay.",
      cta: "Subukan ang kahina-hinalang sulat",
    },
  ],
  card: {
    backTaxes: "Abiso ng utang sa buwis",
    fromIrs: "Sinasabing galing sa IRS",
    scamQ: "Scam?",
    high: "31% mas mahal",
    lateFee: "Pagkalipas ng Nob 30: +$73 na multa",
    addCal: "Idagdag sa kalendaryo",
    reading: "Binabasa para sa iyo",
    letterSays: "Sabi ng sulat, tumawag sa",
    realIrs: "Ang tunay na IRS:",
    giftCards: "Hindi kailanman humihingi ng gift card ang IRS.",
    stepCar: "Tingnan ang kotse at mga litrato mo",
  },
  allTitle: "Lahat mula sa isang litrato",
  allSub: "Walang account at walang ii-install. Bubukas ito sa browser ng telepono mo.",
  all: [
    { title: "Limang wika", body: "Ingles, Armenian, Espanyol, Korean at Tagalog. Magpalit kahit kailan nang walang bagong litrato." },
    { title: "Bilang ng araw sa deadline", body: "Ang mahalagang petsa, ilang araw pa, at paalala sa kalendaryo." },
    { title: "Pag-check ng mali", body: "Hinahanap ang mga mali sa tiket na puwedeng magpawalang-bisa rito." },
    { title: "Sulat ng apela", body: "Nakasulat para sa iyo sa Ingles, handang i-edit at ipadala." },
    { title: "Basahin para sa akin", body: "Puwedeng pakinggan nang malakas ang bawat paliwanag." },
    { title: "Ipadala sa pamilya", body: "Isang link o text na may buod at mga hakbang." },
    { title: "Pag-check ng presyo", body: "Ikinukumpara ang presyo ng kontratista sa karaniwan sa malapit." },
    { title: "Pag-check ng scam", body: "Tinutukoy ang pekeng ahensya at ipinapakita ang tunay na numero." },
  ],
  helpTitle: "Libreng tulong, malapit sa iyo",
  helpSub: "Hindi abogado ang Doc Deco. Kapag kailangan mo ng tao, libre ang mga linyang ito.",
  helpAll: "Tingnan lahat ng numero ng tulong sa Glendale",
  faqTitle: "Mga madalas itanong",
  faqSub: "Binabasa nang isang beses ang litrato mo para isulat ang paliwanag, saka ito nawawala. Walang account na kailangang gawin.",
  faqCall: "Hindi sigurado? Tumawag sa 2-1-1",
  faq: [
    { q: "Libre ba talaga?", a: "Oo. Walang account, walang subscription at walang ads." },
    {
      q: "Legal na payo ba ito?",
      a: "Hindi. Ipinapaliwanag nito ang papel mo sa simpleng salita at inililista ang mga hakbang. Para sa payo, itinuturo ka nito sa libreng lokal na tulong.",
    },
    {
      q: "Anong mga papel ang puwede?",
      a: "Tiket sa paradahan, sulat ng korte at jury, sulat tungkol sa buwis at gobyerno, abiso sa utilities, at quote ng kontratista o pagkukumpuni.",
    },
    { q: "Ano ang nangyayari sa litrato ko?", a: "Binabasa ito nang isang beses para isulat ang paliwanag at hindi kailanman sine-save." },
    {
      q: "Bakit nasa Ingles ang sulat ng apela?",
      a: "Dahil Ingles ang ginagamit ng lungsod sa mga apela. Lahat ng iba ay nasa sarili mong wika.",
    },
    {
      q: "Saan ito puwedeng magkamali?",
      a: "Puwede itong magkamali sa malabong numero. May marka ang mga bahaging hindi sigurado, kaya ikumpara sa papel mo.",
    },
  ],
  ctaTitle: "Dalhin ang pinakanakakatakot.",
  ctaBody: "Mga isang minuto lang ang sulat na iniiwasan mo. Libre, at hindi kailanman sine-save ang litrato mo.",
  footAbout: "Binabasa ng Doc Deco ang opisyal na sulat kasama mo, sa sarili mong wika, at ibinibigay ang susunod na hakbang.",
  footMade: "Ginawa para sa Glendale hackathon.",
};

export const LANDING: Record<Lang, LandingStrings> = { en, hy, es, ko, tl };
