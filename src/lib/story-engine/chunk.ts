/**
 * Split a narration script into chunks under `max` characters, breaking on
 * paragraph then sentence boundaries so we never cut mid-word. TTS providers
 * cap input length (OpenAI ~4096 chars/request), so long stories are
 * synthesised in pieces and the audio concatenated.
 */
export function chunkText(text: string, max = 3500): string[] {
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  const flush = () => {
    if (current.trim()) chunks.push(current.trim());
    current = "";
  };

  for (const para of paragraphs) {
    if (para.length > max) {
      // Paragraph itself too long: split by sentence.
      flush();
      const sentences = para.match(/[^.!?]+[.!?]*\s*/g) ?? [para];
      for (const s of sentences) {
        if (current.length + s.length > max) flush();
        current += s;
      }
      flush();
    } else if (current.length + para.length + 2 > max) {
      flush();
      current = para;
    } else {
      current = current ? `${current}\n\n${para}` : para;
    }
  }
  flush();
  return chunks;
}
