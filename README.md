## Nebula Studio — Text-to-Video Synthesizer

Nebula Studio is a browser-native motion graphics lab that converts descriptive prompts into animated video clips in minutes. The compositor runs entirely on the client using the Canvas and MediaRecorder APIs, combining orbital motion graphics, gradient palettes, and typographic staging to deliver export-ready 1280×720 WebM files without leaving the page.

### Features
- **Prompt-to-motion pipeline** – each sentence in your prompt becomes a unique animated beat rendered with adaptive gradients and motion cues.
- **Visual styles** – switch between cinematic palettes (Cosmic, Tropical, Noir, Sunrise, Aqua, Mono) to instantly reshape the mood of the video.
- **Fine-grained controls** – tune frames-per-second and segment duration to balance energy vs. pacing.
- **Full in-browser rendering** – the generator never uploads frames to a server, keeping concepts private and responsive.
- **Instant preview & export** – watch the render progress in real-time, then download the finished WebM clip or copy a shareable object URL.

### Tech Stack
- [Next.js](https://nextjs.org/) App Router with TypeScript and Tailwind
- CSS-powered gradients overlaid with Canvas animations
- MediaRecorder API for on-device encoding
- Google Fonts (DM Sans, Space Grotesk) for display + motion typography

### Local Development

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` and craft a multi-sentence prompt to begin rendering. Adjust style, FPS, or segment length to tailor the output.

### Production Build

```bash
npm run build
npm run start
```

### Export Tips
- Keep sentences concise (6–14 words) to generate readable, rhythmic beats.
- Raise the FPS for smoother camera motion; lengthen segment duration for slower, cinematic transitions.
- Because the app relies on MediaRecorder, use a Chromium-based browser for the most reliable exports. Safari currently has partial support.

### Extending Nebula Studio
- Swap the Canvas renderer with a custom shader or WebGL pipeline for richer particle systems.
- Stream scenes to a serverless endpoint that stitches them with FFmpeg for longer sequences.
- Integrate background audio and waveform-reactive visuals using the Web Audio API.

### License
MIT
