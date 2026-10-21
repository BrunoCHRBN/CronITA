export interface Topic {
  id: string;
  name: string;
}

export interface Subject {
  id: string;
  name: string;
  /** Short label used in compact places (badges, tab title). */
  short: string;
  topics: Topic[];
}

function slug(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function subject(id: string, name: string, short: string, topics: string[]): Subject {
  return {
    id,
    name,
    short,
    topics: topics.map((t) => ({ id: `${id}:${slug(t)}`, name: t })),
  };
}

/** Conteúdo programático das provas do vestibular do ITA. */
export const SUBJECTS: Subject[] = [
  subject("matematica", "Matemática", "MAT", [
    "Conjuntos e lógica",
    "Funções",
    "Função exponencial e logarítmica",
    "Trigonometria",
    "Números complexos",
    "Polinômios e equações algébricas",
    "Sequências e progressões",
    "Matrizes, determinantes e sistemas lineares",
    "Análise combinatória",
    "Binômio de Newton",
    "Probabilidade",
    "Inequações",
    "Geometria plana",
    "Geometria espacial",
    "Geometria analítica",
    "Cônicas",
  ]),
  subject("fisica", "Física", "FÍS", [
    "Análise dimensional e vetores",
    "Cinemática",
    "Dinâmica",
    "Trabalho, energia e potência",
    "Impulso e quantidade de movimento",
    "Estática",
    "Gravitação",
    "Hidrostática",
    "Termologia e calorimetria",
    "Termodinâmica",
    "Movimento harmônico simples",
    "Ondulatória e acústica",
    "Óptica geométrica",
    "Óptica física",
    "Eletrostática",
    "Eletrodinâmica",
    "Magnetismo",
    "Indução eletromagnética",
    "Física moderna",
  ]),
  subject("quimica", "Química", "QUÍ", [
    "Estrutura atômica",
    "Tabela periódica",
    "Ligações químicas e geometria molecular",
    "Funções inorgânicas",
    "Estequiometria",
    "Gases",
    "Soluções e propriedades coligativas",
    "Termoquímica",
    "Cinética química",
    "Equilíbrio químico",
    "Equilíbrio iônico e pH",
    "Eletroquímica",
    "Radioatividade",
    "Funções orgânicas",
    "Isomeria",
    "Reações orgânicas",
    "Polímeros",
  ]),
  subject("portugues", "Português", "POR", [
    "Interpretação de texto",
    "Morfologia",
    "Sintaxe",
    "Concordância e regência",
    "Pontuação e crase",
    "Semântica e estilística",
    "Literatura brasileira",
    "Obras literárias indicadas",
  ]),
  subject("ingles", "Inglês", "ING", [
    "Interpretação de texto",
    "Vocabulário e expressões",
    "Tempos verbais",
    "Gramática",
  ]),
  subject("redacao", "Redação", "RED", [
    "Estrutura dissertativo-argumentativa",
    "Repertório e argumentação",
    "Coesão e coerência",
    "Redações de prática",
  ]),
];

export const SUBJECT_BY_ID: Record<string, Subject> = Object.fromEntries(
  SUBJECTS.map((s) => [s.id, s]),
);

export const TOPIC_BY_ID: Record<string, Topic> = Object.fromEntries(
  SUBJECTS.flatMap((s) => s.topics.map((t) => [t.id, t])),
);

export const TOTAL_TOPICS = SUBJECTS.reduce((n, s) => n + s.topics.length, 0);
