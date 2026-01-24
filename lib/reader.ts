import fs from 'fs';
import path from 'path';
import { marked } from 'marked';

const CONTENT_DIR = path.join(process.cwd(), 'content', 'book');

export type Chapter = { slug: string; title: string; file: string };

export function getChapters(): Chapter[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.md'));
  return files.map((file) => {
    const slug = file.replace(/\.md$/, '');
    const title = slug
      .split('-')
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(' ');
    return { slug, title, file: path.join(CONTENT_DIR, file) };
  });
}

export function getChapter(slug: string): { html: string; codeBlocks: string[]; title: string } | null {
  const file = path.join(CONTENT_DIR, `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  const src = fs.readFileSync(file, 'utf8');
  const tokens = marked.lexer(src);
  const codeBlocks: string[] = [];
  for (const t of tokens) {
    if (t.type === 'code' && typeof (t as any).text === 'string') {
      codeBlocks.push((t as any).text as string);
    }
  }
  const html = marked.parse(src) as string;
  const title = slug.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
  return { html, codeBlocks, title };
}

