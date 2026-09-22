import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

async function getPuppeteer() {
  try {
    const mod = await import('puppeteer');
    return mod.default || mod;
  } catch (e1) {
    try {
      const fallbackPath = 'c:/Users/ramag/Documents/antigravity/eager-archimedes/anchit_natasha_ar_tracker/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';
      const mod = await import(pathToFileURL(fallbackPath).href);
      return mod.default || mod;
    } catch (e2) {
      try {
        return require('c:/Users/ramag/Documents/antigravity/eager-archimedes/anchit_natasha_ar_tracker/node_modules/puppeteer');
      } catch (e3) {
        throw new Error('Puppeteer could not be loaded: ' + e2.message);
      }
    }
  }
}

function getSystemBrowserPath() {
  const browserPaths = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
  ];
  for (const p of browserPaths) {
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}

async function compile() {
  const inputArg = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(process.cwd(), 'target_card.png');
  const outputArg = process.argv[3] ? path.resolve(process.argv[3]) : path.resolve(process.cwd(), 'targets.mind');

  if (!fs.existsSync(inputArg)) {
    console.error(`❌ Target image file not found: ${inputArg}`);
    process.exit(1);
  }

  console.log(`\n🎯 MindAR Target Compiler`);
  console.log(`   Input Target : ${inputArg}`);
  console.log(`   Output File  : ${outputArg}`);

  const puppeteer = await getPuppeteer();
  const systemBrowser = getSystemBrowserPath();
  const launchOptions = {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--enable-webgl',
      '--use-gl=angle',
      '--ignore-gpu-blocklist'
    ]
  };
  if (systemBrowser) {
    launchOptions.executablePath = systemBrowser;
    console.log(`   Browser Exec : ${systemBrowser}`);
  }

  console.log('🚀 Launching headless browser with WebGL...');
  const browser = await puppeteer.launch(launchOptions);
  const page = await browser.newPage();

  page.on('console', msg => console.log('   [Browser]', msg.text()));
  page.on('pageerror', err => console.error('   [Browser Error]', err));

  const imgBase64 = fs.readFileSync(inputArg).toString('base64');
  const ext = path.extname(inputArg).toLowerCase() === '.png' ? 'png' : 'jpeg';
  const dataUri = `data:image/${ext};base64,${imgBase64}`;

  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <script type="module">
      import { Compiler } from "https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image.prod.js";
      window.Compiler = Compiler;
      window.moduleLoaded = true;
    </script>
  </head>
  <body>
    <img id="target" src="${dataUri}">
    <script>
      async function runCompile() {
        while (!window.moduleLoaded) {
          await new Promise(r => setTimeout(r, 100));
        }
        const img = document.getElementById('target');
        await new Promise(r => { if(img.complete) r(); else img.onload = r; });
        console.log('Target image loaded: ' + img.naturalWidth + 'x' + img.naturalHeight);
        
        const compiler = new window.Compiler();
        await compiler.compileImageTargets([img], (p) => {
          console.log('Compilation progress: ' + Math.round(p) + '%');
        });
        const exportedBuffer = await compiler.exportData();
        let binary = '';
        const bytes = new Uint8Array(exportedBuffer);
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
      }
      window.runCompile = runCompile;
    </script>
  </body>
  </html>
  `;

  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  console.log('⏳ Compiling target features via MindAR GPU pipeline...');
  const base64Result = await page.evaluate(async () => {
    return await window.runCompile();
  });

  const buffer = Buffer.from(base64Result, 'base64');
  fs.mkdirSync(path.dirname(outputArg), { recursive: true });
  fs.writeFileSync(outputArg, buffer);

  console.log(`\n🎉 SUCCESS! Generated ${outputArg} (${buffer.length} bytes)`);
  await browser.close();
}

compile().catch(err => {
  console.error('❌ Compilation failed:', err);
  process.exit(1);
});
