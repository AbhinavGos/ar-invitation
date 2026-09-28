import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseArgs() {
  const args = process.argv.slice(2);
  const params = {
    name: 'AR Card Invitation',
    slug: '',
    target: '',
    cards: [],
    theme: 'royal-wedding',      // royal-wedding | haldi-garden | cocktail-glam | corporate-summit | minimal-luxury
    layout: 'hybrid',            // carousel | triptych | diorama | popout | hybrid
    silhouette: 'arch',          // arch | scalloped | chamfer | deckled | portal | rect
    depth: 'gold-foil',          // gold-foil | silver-chrome | paper-matte | neon-glow | flat
    anchor: 'back-edge',         // back-edge | center | offset
    outDir: '',
    deploy: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--name' && args[i + 1]) params.name = args[++i];
    else if (arg === '--slug' && args[i + 1]) params.slug = args[++i];
    else if (arg === '--target' && args[i + 1]) params.target = args[++i];
    else if (arg === '--cards' && args[i + 1]) params.cards = args[++i].split(',').map(s => s.trim());
    else if (arg === '--theme' && args[i + 1]) params.theme = args[++i];
    else if (arg === '--layout' && args[i + 1]) params.layout = args[++i];
    else if (arg === '--silhouette' && args[i + 1]) params.silhouette = args[++i];
    else if (arg === '--depth' && args[i + 1]) params.depth = args[++i];
    else if (arg === '--anchor' && args[i + 1]) params.anchor = args[++i];
    else if (arg === '--outDir' && args[i + 1]) params.outDir = args[++i];
    else if (arg === '--deploy') params.deploy = true;
  }

  // Smart defaults based on theme if not explicitly set
  if (params.theme === 'cocktail-glam') {
    if (!args.includes('--silhouette')) params.silhouette = 'chamfer';
    if (!args.includes('--depth')) params.depth = 'silver-chrome';
    if (!args.includes('--layout')) params.layout = 'hybrid';
  } else if (params.theme === 'haldi-garden') {
    if (!args.includes('--silhouette')) params.silhouette = 'scalloped';
    if (!args.includes('--depth')) params.depth = 'paper-matte';
    if (!args.includes('--layout')) params.layout = 'triptych';
  } else if (params.theme === 'corporate-summit') {
    if (!args.includes('--silhouette')) params.silhouette = 'chamfer';
    if (!args.includes('--depth')) params.depth = 'silver-chrome';
    if (!args.includes('--layout')) params.layout = 'carousel';
  } else if (params.theme === 'minimal-luxury') {
    if (!args.includes('--silhouette')) params.silhouette = 'deckled';
    if (!args.includes('--depth')) params.depth = 'paper-matte';
    if (!args.includes('--layout')) params.layout = 'hybrid';
  }

  if (!params.slug) {
    params.slug = params.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (!params.slug) params.slug = 'ar-card-' + Date.now();
  }

  if (!params.outDir) {
    params.outDir = path.resolve(process.cwd(), params.slug);
  } else {
    params.outDir = path.resolve(params.outDir);
  }

  return params;
}

async function main() {
  const params = parseArgs();
  console.log(`\n======================================================`);
  console.log(`🎴 Universal WebAR Card Experience Generator`);
  console.log(`======================================================`);
  console.log(`Name       : ${params.name}`);
  console.log(`Slug       : ${params.slug}`);
  console.log(`Theme      : ${params.theme}`);
  console.log(`Layout     : ${params.layout} (carousel | triptych | diorama | popout | hybrid)`);
  console.log(`Silhouette : ${params.silhouette} (arch | scalloped | chamfer | deckled | portal | rect)`);
  console.log(`Depth      : ${params.depth} (gold-foil | silver-chrome | paper-matte | neon-glow | flat)`);
  console.log(`Anchor     : ${params.anchor} (back-edge | center | offset)`);
  console.log(`OutDir     : ${params.outDir}`);
  console.log(`Target     : ${params.target || '(none provided, placeholder)'}`);
  console.log(`Cards      : ${params.cards.length ? params.cards.join(', ') : '(procedural fallback)'}`);
  console.log(`Deploy     : ${params.deploy ? 'Yes (Auto GitHub Pages)' : 'No (Local scaffolding only)'}`);
  console.log(`------------------------------------------------------\n`);

  fs.mkdirSync(params.outDir, { recursive: true });

  // 1. Locate template index.html
  const templatePath = path.resolve(__dirname, '../resources/template_index.html');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found at ${templatePath}`);
  }
  let indexHtml = fs.readFileSync(templatePath, 'utf8');

  // Customize page title and meta
  indexHtml = indexHtml.replace(/<title>.*?<\/title>/, `<title>${params.name} · Interactive WebAR Experience</title>`);

  // 2. Handle Target Card and Targets.mind
  if (params.target && fs.existsSync(params.target)) {
    const ext = path.extname(params.target);
    const destTargetImg = path.join(params.outDir, 'target_card' + ext);
    fs.copyFileSync(params.target, destTargetImg);
    console.log(`✅ Copied visual trigger card to: ${destTargetImg}`);

    // Compile targets.mind using compile_target.mjs
    const compilerScript = path.join(__dirname, 'compile_target.mjs');
    const destMind = path.join(params.outDir, 'targets.mind');
    console.log(`⏳ Compiling targets.mind using headless GPU compiler...`);
    try {
      execSync(`node "${compilerScript}" "${destTargetImg}" "${destMind}"`, { stdio: 'inherit' });
      console.log(`✅ targets.mind successfully compiled!`);
    } catch (compileErr) {
      console.warn(`⚠️ Warning: targets.mind compilation failed or timed out. Please compile manually.`);
    }
  } else {
    console.log(`ℹ️ No target image supplied. Place your visual trigger as target_card.png and run compile_target.mjs.`);
  }

  // 3. Handle Card Content Images & Build Card Config
  const cardObjects = [];
  if (params.cards && params.cards.length > 0) {
    params.cards.forEach((cardPath, idx) => {
      if (fs.existsSync(cardPath)) {
        const ext = path.extname(cardPath) || '.jpg';
        const cardName = `card_${idx + 1}${ext}`;
        fs.copyFileSync(cardPath, path.join(params.outDir, cardName));
        cardObjects.push({
          url: `./${cardName}`,
          title: `Ceremony ${idx + 1}`,
          date: `Event ${idx + 1}`,
          color: (idx === 0) ? '#f59e0b' : (idx === 1) ? '#eab308' : '#dc2626'
        });
      }
    });
    console.log(`✅ Copied ${cardObjects.length} custom event cards.`);
  }

  // 4. Inject Dynamic AR_CONFIG Object into index.html
  const injectedConfig = {
    name: params.name,
    theme: params.theme,
    layout: params.layout,
    silhouette: params.silhouette,
    depth: params.depth,
    anchorPosition: params.anchor,
    cards: cardObjects.length > 0 ? cardObjects : [
      { title: "Welcome & Mehndi", date: "Day 1 · Evening", color: "#f59e0b", type: "mehndi" },
      { title: "Auspicious Haldi", date: "Day 2 · Morning", color: "#eab308", type: "haldi" },
      { title: "Wedding & Reception", date: "Day 2 · Night", color: "#dc2626", type: "wedding" }
    ]
  };

  const configScript = `<script>window.AR_CONFIG = ${JSON.stringify(injectedConfig, null, 2)};</script>`;
  indexHtml = indexHtml.replace('</head>', `${configScript}\n</head>`);

  // Save generated index.html
  const destIndexHtml = path.join(params.outDir, 'index.html');
  fs.writeFileSync(destIndexHtml, indexHtml, 'utf8');
  console.log(`✅ Saved customized index.html`);

  // 5. Git & GitHub Pages Auto-Deploy
  if (params.deploy) {
    console.log(`\n🚀 Initializing Git repository and deploying to GitHub Pages...`);
    try {
      execSync(`git init`, { cwd: params.outDir, stdio: 'inherit' });
      execSync(`git add .`, { cwd: params.outDir, stdio: 'inherit' });
      execSync(`git commit -m "Initial WebAR Card: ${params.name}"`, { cwd: params.outDir, stdio: 'inherit' });
      
      console.log(`📡 Creating remote GitHub repository: AbhinavGos/${params.slug}...`);
      execSync(`gh repo create AbhinavGos/${params.slug} --public --source=. --push`, { cwd: params.outDir, stdio: 'inherit' });

      console.log(`⚙️ Enabling GitHub Pages deployment...`);
      try {
        execSync(`gh api repos/AbhinavGos/${params.slug}/pages -X POST -F "source[branch]=master" -F "source[path]=/"`, { cwd: params.outDir, stdio: 'inherit' });
      } catch(e) {
        try {
          execSync(`gh api repos/AbhinavGos/${params.slug}/pages -X POST -F "source[branch]=main" -F "source[path]=/"`, { cwd: params.outDir, stdio: 'inherit' });
        } catch(e2) {}
      }

      console.log(`\n🎉 DEPLOYMENT COMPLETE!`);
      console.log(`👉 Live Dedicated URL: https://abhinavgos.github.io/${params.slug}/`);
    } catch (deployErr) {
      console.error(`❌ Deployment failed:`, deployErr.message);
    }
  } else {
    console.log(`\n💡 To deploy this card to its own unique live URL:`);
    console.log(`   cd ${params.outDir}`);
    console.log(`   git init && git add . && git commit -m "Initial AR card"`);
    console.log(`   gh repo create AbhinavGos/${params.slug} --public --source=. --push`);
    console.log(`   👉 Live URL will be: https://abhinavgos.github.io/${params.slug}/\n`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
