import sharp from "sharp";
import { existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const logoPath = resolve(root, "logo.PNG");
const outPath = resolve(root, "public", "favicon.ico");

// SVG recreation of the JardiPro logo for fallback
const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="8" fill="#3aaa35"/>
  <!-- Saw blade / sun wheel -->
  <g transform="translate(18,32)">
    <circle cx="0" cy="0" r="11" fill="#f5d800"/>
    <circle cx="0" cy="0" r="5" fill="#3aaa35"/>
    ${Array.from({ length: 8 }, (_, i) => {
      const angle = (i * 45 * Math.PI) / 180;
      const x1 = Math.cos(angle) * 7;
      const y1 = Math.sin(angle) * 7;
      const x2 = Math.cos(angle) * 13;
      const y2 = Math.sin(angle) * 13;
      return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#f5d800" stroke-width="3.5" stroke-linecap="round"/>`;
    }).join("\n    ")}
  </g>
  <!-- "jardi" text -->
  <text x="32" y="27" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="white" text-anchor="middle" letter-spacing="-0.3">jardi</text>
  <!-- "PRO" text -->
  <text x="32" y="41" font-family="Arial,sans-serif" font-size="14" font-weight="900" fill="#f5d800" text-anchor="middle" letter-spacing="1">PRO</text>
</svg>`;

async function run() {
  let source;

  if (existsSync(logoPath)) {
    console.log("Using logo.PNG from project root");
    source = sharp(logoPath);
  } else {
    console.log("logo.PNG not found — generating from SVG template");
    source = sharp(Buffer.from(logoSvg), { density: 300 });
  }

  // Generate 32x32 PNG then save as .ico (modern browsers accept PNG-in-ICO)
  await source
    .resize(32, 32, { fit: "cover" })
    .toFormat("png")
    .toFile(outPath);

  console.log(`favicon.ico written to ${outPath}`);
}

run().catch((e) => { console.error(e); process.exit(1); });
