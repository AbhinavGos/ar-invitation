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
    outDir: '',
    deploy: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--name' && args[i + 1]) params.name = args[++i];
    else if (arg === '--slug' && args[i + 1]) params.slug = args[++i];
    else if (arg === '--target' && args[i + 1]) params.target = args[++i];
    else if (arg === '--cards' && args[i + 1]) params.cards = args[++i].split(',').map(s => s.trim());
    else if (arg === '--outDir' && args[i + 1]) params.outDir = args[++i];
    else if (arg === '--deploy') params.deploy = true;
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
  console.log(`🎴 AR Card Invitation Project Generator`);
  console.log(`======================================================`);
  console.log(`Name    : ${params.name}`);
  console.log(`Slug    : ${params.slug}`);
  console.log(`OutDir  : ${params.outDir}`);
  console.log(`Target  : ${params.target || '(none provided, using placeholder)'}`);
  console.log(`Cards   : ${params.cards.length ? params.cards.join(', ') : '(procedural fallback)'}`);
  console.log(`Deploy  : ${params.deploy ? 'Yes (Auto GitHub Pages)' : 'No (Local scaffolding only)'}`);
  console.log(`------------------------------------------------------\n`);

  fs.mkdirSync(params.outDir, { recursive: true });

  // 1. Locate template index.html
  const templatePath = path.resolve(__dirname, '../resources/template_index.html');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found at ${templatePath}`);
  }
  let indexHtml = fs.readFileSync(templatePath, 'utf8');

  // Customize page title and headers
  indexHtml = indexHtml.replace(/<title>.*?<\/title>/, `<title>${params.name} · Interactive WebAR Experience</title>`);
  indexHtml = indexHtml.replace(/<div class="landing-names">.*?<\/div>/, `<div class="landing-names">${params.name}</div>`);

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

  // 3. Handle Card Content Images
  if (params.cards && params.cards.length > 0) {
    const copiedCardNames = [];
    params.cards.forEach((cardPath, idx) => {
      if (fs.existsSync(cardPath)) {
        const ext = path.extname(cardPath) || '.jpg';
        const cardName = `card_${idx + 1}${ext}`;
        fs.copyFileSync(cardPath, path.join(params.outDir, cardName));
        copiedCardNames.push(`./${cardName}`);
      }
    });

    if (copiedCardNames.length > 0) {
      console.log(`✅ Copied ${copiedCardNames.length} custom event cards.`);
      // Inject custom cards array into index.html
      const cardUrlsJson = JSON.stringify(copiedCardNames);
      const customCardLoader = `
    // Custom Uploaded Content Cards (${copiedCardNames.length} cards)
    const cardImageUrls = ${cardUrlsJson};
    const cardGeo = new THREE.PlaneGeometry(0.74, 1.146);
    cardGeo.translate(0, 1.146 / 2, 0); // Bottom edge rests on pedestal

    const texLoader = new THREE.TextureLoader();
    cardMeshes = [];
    cardImageUrls.forEach((url, i) => {
      const tex = texLoader.load(url);
      tex.colorSpace = THREE.SRGBColorSpace;
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: (i === 0) ? 1.0 : 0.55
      });
      const mesh = new THREE.Mesh(cardGeo, mat);
      mesh.position.set(0, 0, 0);
      mesh.userData = { index: i };
      cardsCarouselGroup.add(mesh);
      cardMeshes.push(mesh);
    });
      `;
      // Replace the procedural types.forEach loop
      indexHtml = indexHtml.replace(
        /\/\/ Build 3 Event Cards with bottom pivot[\s\S]*?cardMeshes\.push\(mesh\);\s*\}\);/,
        customCardLoader.trim()
      );
    }
  }

  // Save generated index.html
  const destIndexHtml = path.join(params.outDir, 'index.html');
  fs.writeFileSync(destIndexHtml, indexHtml, 'utf8');
  console.log(`✅ Saved customized index.html`);

  // 4. Git & GitHub Pages Auto-Deploy
  if (params.deploy) {
    console.log(`\n🚀 Initializing Git repository and deploying to GitHub Pages...`);
    try {
      execSync(`git init`, { cwd: params.outDir, stdio: 'inherit' });
      execSync(`git add .`, { cwd: params.outDir, stdio: 'inherit' });
      execSync(`git commit -m "Initial WebAR Card Invitation: ${params.name}"`, { cwd: params.outDir, stdio: 'inherit' });
      
      console.log(`📡 Creating remote GitHub repository: AbhinavGos/${params.slug}...`);
      execSync(`gh repo create AbhinavGos/${params.slug} --public --source=. --push`, { cwd: params.outDir, stdio: 'inherit' });

      console.log(`⚙️ Enabling GitHub Pages deployment...`);
      try {
        execSync(`gh api repos/AbhinavGos/${params.slug}/pages -X POST -F "source[branch]=master" -F "source[path]=/"`, { cwd: params.outDir, stdio: 'inherit' });
      } catch(e) {
        // If master is named main or default
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
