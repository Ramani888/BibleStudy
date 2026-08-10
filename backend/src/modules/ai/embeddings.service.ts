import { prisma } from '../../config/db';
import { env } from '../../config/env';

const VOYAGE_API = 'https://api.voyageai.com/v1/embeddings';
const VOYAGE_MODEL = 'voyage-3.5-lite';
const DIMS = 512;
const TOP_K = 5;

async function embed(texts: string[], inputType: 'document' | 'query'): Promise<number[][]> {
  if (!env.VOYAGE_API_KEY) return [];

  const res = await fetch(VOYAGE_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.VOYAGE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: VOYAGE_MODEL, input: texts, input_type: inputType, output_dimension: DIMS }),
  });

  if (!res.ok) {
    console.error(`Voyage API error: ${res.status} ${await res.text().catch(() => '')}`);
    return [];
  }

  const data = (await res.json()) as { data: { embedding: number[] }[] };
  return data.data.map(d => d.embedding);
}

function vectorToSql(v: number[]): string {
  return `[${v.join(',')}]`;
}

export async function storeCardEmbedding(cardId: string, question: string, answer: string): Promise<void> {
  const text = `Q: ${question}\nA: ${answer}`;
  const [vec] = await embed([text], 'document');
  if (!vec) return;

  await prisma.$executeRawUnsafe(
    `UPDATE "Card" SET embedding = $1::vector WHERE id = $2`,
    vectorToSql(vec),
    cardId,
  );
}

export async function storeNoteEmbedding(noteId: string, title: string, body: string): Promise<void> {
  // Truncate body to ~1000 chars — voyage-3.5-lite has 32K context but short chunks retrieve better
  const text = `${title}\n${body.slice(0, 1000)}`;
  const [vec] = await embed([text], 'document');
  if (!vec) return;

  await prisma.$executeRawUnsafe(
    `UPDATE "Note" SET embedding = $1::vector WHERE id = $2`,
    vectorToSql(vec),
    noteId,
  );
}

type CardRow = { question: string; answer: string };
type NoteRow = { title: string; body: string };

export async function retrieveContext(userId: string, question: string): Promise<string> {
  if (!env.VOYAGE_API_KEY) return '';

  const [queryVec] = await embed([question], 'query');
  if (!queryVec) return '';

  const vecSql = vectorToSql(queryVec);

  const [cards, notes] = await Promise.all([
    prisma.$queryRawUnsafe<CardRow[]>(
      `SELECT question, answer
       FROM "Card"
       WHERE "userId" = $1 AND embedding IS NOT NULL
       ORDER BY embedding <=> $2::vector
       LIMIT $3`,
      userId, vecSql, TOP_K,
    ),
    prisma.$queryRawUnsafe<NoteRow[]>(
      `SELECT title, body
       FROM "Note"
       WHERE "userId" = $1 AND embedding IS NOT NULL
       ORDER BY embedding <=> $2::vector
       LIMIT $3`,
      userId, vecSql, TOP_K,
    ),
  ]);

  if (cards.length === 0 && notes.length === 0) return '';

  const lines: string[] = ['The user has these relevant items in their personal study library:'];
  cards.forEach(c => lines.push(`[Card] Q: ${c.question} | A: ${c.answer}`));
  notes.forEach(n => lines.push(`[Note] ${n.title}: ${n.body.slice(0, 300)}`));
  lines.push('Use these only if they are relevant to the question. Do not mention them otherwise.');

  return lines.join('\n');
}
