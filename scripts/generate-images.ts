import { config } from "dotenv";
import fs from "fs";
import path from "path";

config({ path: ".env.local" });

const VALID_SEASONS = ["spring", "summer", "fall", "winter"] as const;
type Season = (typeof VALID_SEASONS)[number];

const args = process.argv.slice(2);
const seasonArg = args[args.indexOf("--season") + 1] as Season | undefined;
const force = args.includes("--force");

if (!seasonArg || !VALID_SEASONS.includes(seasonArg)) {
  console.error(
    `Usage: npm run generate-images -- --season <${VALID_SEASONS.join("|")}> [--force]`
  );
  process.exit(1);
}

const token = process.env.HUGGINGFACE_TOKEN;
if (!token) {
  console.error("Missing HUGGINGFACE_TOKEN in .env.local");
  process.exit(1);
}

const dataPath = path.join(process.cwd(), "data/seasons", `${seasonArg}.json`);
const seasonData = JSON.parse(fs.readFileSync(dataPath, "utf-8")) as {
  trends: { name: string; imagePrompt: string; imagePath: string }[];
};

for (const trend of seasonData.trends) {
  const outputPath = path.join(process.cwd(), "public", trend.imagePath);

  if (fs.existsSync(outputPath) && !force) {
    console.log(`Skipping "${trend.name}" — image already exists. Use --force to regenerate.`);
    continue;
  }

  console.log(`Generating image for: ${trend.name}`);

  const response = await fetch(
    "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: trend.imagePrompt }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    console.error(`Failed for "${trend.name}": ${response.status} — ${text}`);
    continue;
  }

  const buffer = await response.arrayBuffer();
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, Buffer.from(buffer));
  console.log(`Saved: ${trend.imagePath}`);
}

console.log("Done.");
