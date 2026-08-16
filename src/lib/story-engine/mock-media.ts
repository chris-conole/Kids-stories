/**
 * Mock media generators so the Plus pipeline (storage → asset → reader) can be
 * exercised end-to-end without any paid API keys. Set TTS_PROVIDER=mock or
 * IMAGE_PROVIDER=mock. Never use these in production — they produce a silent
 * clip and a placeholder card.
 */

/** A short silent mono WAV, built in-code (no binary blobs to trust). */
export function silentWav(seconds = 2, sampleRate = 8000): Uint8Array {
  const numSamples = seconds * sampleRate;
  const dataSize = numSamples * 2; // 16-bit mono
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);
  // Samples default to 0 (silence).
  return new Uint8Array(buffer);
}

/** A soft placeholder illustration card as SVG. */
export function placeholderSvg(caption: string, sceneIndex: number): Uint8Array {
  const hue = (sceneIndex * 47) % 360;
  const safe = caption
    .slice(0, 90)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl(${hue} 60% 82%)"/>
      <stop offset="1" stop-color="hsl(${(hue + 40) % 360} 55% 70%)"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#g)"/>
  <circle cx="820" cy="200" r="90" fill="#fff" opacity="0.55"/>
  <text x="512" y="500" font-family="Georgia, serif" font-size="52" fill="#2b2954" text-anchor="middle" opacity="0.85">Scene ${sceneIndex + 1}</text>
  <text x="512" y="560" font-family="Georgia, serif" font-size="26" fill="#3d3a79" text-anchor="middle" opacity="0.7">${safe}</text>
</svg>`;
  return new TextEncoder().encode(svg);
}
