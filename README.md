# PANDA — A Journey Through China
**Discover the Giant Panda. Explore China. Learn Mandarin.**

An interactive 3D natural history documentary and university-level Mandarin Chinese learning platform built with **Three.js**, **React**, **TypeScript**, **GSAP**, **Tailwind CSS**, and the **Web Audio API**.

## Features

- **9 Interconnected 3D Documentary Chapters**:
  1. **The First Encounter (初识大熊猫)** — Misty bamboo forest entrance with volumetric sunbeams.
  2. **Meet the Panda (认识大熊猫)** — Interactive 3D Anatomy Lab with clickable hotspots including the evolved pseudo-thumb (`伪拇指`).
  3. **Home in the Mountains (熊猫的家)** — 3D Western China mountain terrain & locator globe highlighting Sichuan, Shaanxi, and Gansu.
  4. **The Bamboo Life (竹子的世界)** — Bamboo part explorer (`竹笋`, `竹叶`, `竹茎`) and animated daily routine behaviors (`Feeding`, `Resting`, `Climbing`, `Roaming`).
  5. **From Cub to Adult (熊猫的成长)** — Life-cycle visualization comparing the 90–130 g newborn pink cub, playful juvenile, and adult mother panda.
  6. **The Fight for Survival (保护大熊猫)** — Interactive forest-corridor restoration simulation paired with dated IUCN, WWF, and NFGA conservation data.
  7. **Panda Diplomacy (熊猫外交)** — Rotating 3D Earth globe tracing conservation partnerships from Chengdu to Washington D.C., Tokyo, Europe, Doha, and Singapore.
  8. **Why Pandas Matter (为什么大熊猫很重要)** — Panoramic umbrella-species ecosystem showcasing golden snub-nosed monkeys, red pandas, takins, and Yangtze watersheds.
  9. **The Final Challenge (熊猫知识挑战)** — Four-format interactive quiz (knowledge, vocabulary matching, listening comprehension, and Chinese sentence construction) closing with *保护熊猫，保护自然。谢谢大家！*
- **Integrated Mandarin Learning System**:
  - 34 curated vocabulary entries with Chinese characters, tone-marked Pinyin, English translations, visual cues, bilingual example sentences, and `zh-CN` speech pronunciation.
  - Persistent Mandarin Learning Drawer + **Mandarin Studio** featuring animated flashcards and 5 interactive language mini-games.
- **University Classroom Presenter Mode**:
  - Previous/Next buttons, direct 1–9 chapter selection, keyboard navigation (`←`/`→`, `1–9`, `Space` pause, `M` Mandarin panel, `H` Zen collapse), bilingual `EN / 中文` toggle, sound ambience toggle, and fullscreen support.

## Installation & Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

## Unit Tests & Linting

```bash
npx --yes tsx --test src/utils/learningLogic.test.ts
npm run lint
```

## Production Build & Static Deployment (Netlify / Vercel)

```bash
npm run build
```

This generates a static production bundle in `dist/` ready for zero-configuration deployment on **Netlify** or **Vercel** (build command: `npm run build`, publish/output directory: `dist`).

## Trusted Scientific Sources

- **IUCN Red List of Threatened Species** (*Ailuropoda melanoleuca* Assessment, 2016)
- **World Wildlife Fund (WWF)** (Giant Panda Conservation & Fourth National Survey)
- **Smithsonian's National Zoo & Conservation Biology Institute**
- **National Geographic** (Giant Panda Habitat & Camouflage)
- **National Forestry and Grassland Administration of China (NFGA)**
