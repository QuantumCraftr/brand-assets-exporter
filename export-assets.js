#!/usr/bin/env node

/**
 * BRAND ASSETS EXPORTER
 * 
 * Script Node.js pour exporter automatiquement des logos et assets de marque en plusieurs formats.
 * Compatible avec tous les SVG exportés depuis Figma, Illustrator, etc.
 * 
 * Usage: node export-assets.js
 */

const fs = require('fs-extra');
const path = require('path');
const sharp = require('sharp');
const toIco = require('to-ico');

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  INPUT_DIR: './exports',
  OUTPUT_DIR: './output',
  SIZES: {
    LOGO_RETINA: { width: 1200, height: 300 },
    LOGO_STANDARD: { width: 600, height: 150 },
    ICON_SIZES: [512, 192, 180, 96, 48, 32, 16],
    POWERED_BY: { width: 400, height: 100 },
    OG_IMAGE: { width: 1200, height: 630 },
    TWITTER_CARD: { width: 1200, height: 600 }
  },
  OG_BACKGROUNDS: {
    dark: '#1a1a1a',
    light: '#ffffff',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  }
};

// ============================================
// UTILITAIRES
// ============================================

async function createOutputStructure() {
  const dirs = [
    path.join(CONFIG.OUTPUT_DIR, 'logos', 'full'),
    path.join(CONFIG.OUTPUT_DIR, 'logos', 'icon'),
    path.join(CONFIG.OUTPUT_DIR, 'logos', 'powered-by'),
    path.join(CONFIG.OUTPUT_DIR, 'favicons'),
    path.join(CONFIG.OUTPUT_DIR, 'social'),
    path.join(CONFIG.OUTPUT_DIR, 'print')
  ];
  for (const dir of dirs) {
    await fs.ensureDir(dir);
  }
  console.log('✅ Structure de dossiers créée');
}

function getSvgFiles() {
  const files = fs.readdirSync(CONFIG.INPUT_DIR)
    .filter(f => f.toLowerCase().endsWith('.svg'));
  if (files.length === 0) {
    console.error('\n❌ Aucun fichier SVG trouvé dans /exports');
    process.exit(1);
  }
  console.log(`\n🔍 ${files.length} fichiers SVG trouvés dans /exports :`);
  files.forEach(f => console.log(`  ✓ ${f}`));
  return files;
}

async function copySvgSources(svgFiles) {
  console.log('📁 Copie des SVG sources...');
  for (const file of svgFiles) {
    const src = path.join(CONFIG.INPUT_DIR, file);
    const dest = path.join(CONFIG.OUTPUT_DIR, 'logos', 'full', file);
    await fs.copy(src, dest);
    console.log(`  ✓ ${file}`);
  }
  console.log('✅ SVG sources copiés\n');
}

async function svgToPng(svgPath, outputPath, width, height = null) {
  try {
    const svgBuffer = await fs.readFile(svgPath);
    let sharpInstance = sharp(svgBuffer);
    if (height) {
      sharpInstance = sharpInstance.resize(width, height, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      });
    } else {
      sharpInstance = sharpInstance.resize(width, width, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      });
    }
    await sharpInstance.png().toFile(outputPath);
    return true;
  } catch (error) {
    console.error(`  ❌ Erreur conversion ${path.basename(outputPath)}:`, error.message);
    return false;
  }
}

async function generateLogoPngs(svgFiles) {
  console.log('🖼️  Génération des PNG @2x pour chaque SVG...');
  for (const file of svgFiles) {
    const svgPath = path.join(CONFIG.INPUT_DIR, file);
    const baseName = path.basename(file, '.svg');
    const outputPath = path.join(
      CONFIG.OUTPUT_DIR, 
      'logos', 
      'full', 
      `${baseName}@2x.png`
    );
    const success = await svgToPng(
      svgPath, 
      outputPath, 
      CONFIG.SIZES.LOGO_RETINA.width,
      CONFIG.SIZES.LOGO_RETINA.height
    );
    if (success) {
      console.log(`  ✓ ${path.basename(outputPath)}`);
    }
  }
  console.log('✅ PNG générés\n');
}

async function generateIcons() {
  console.log('🎯 Génération des icons (multi-tailles)...');
  const svgFiles = fs.readdirSync(CONFIG.INPUT_DIR).filter(f => f.toLowerCase().endsWith('.svg') && f.toLowerCase().includes('icon'));
  if (svgFiles.length === 0) {
    console.log('Aucun fichier icon trouvé dans /exports.');
    return;
  }
  for (const file of svgFiles) {
    const iconSvg = path.join(CONFIG.INPUT_DIR, file);
    const baseName = path.basename(file, '.svg');
    for (const size of CONFIG.SIZES.ICON_SIZES) {
      const outputPath = path.join(
        CONFIG.OUTPUT_DIR,
        'logos',
        'icon',
        `${baseName}-${size}.png`
      );
      const success = await svgToPng(iconSvg, outputPath, size);
      if (success) {
        console.log(`  ✓ ${baseName}-${size}.png`);
      }
    }
  }
  console.log('✅ Icons générés\n');
}

async function generateFavicons() {
  console.log('🌐 Génération des favicons...');
  const svgIcons = fs.readdirSync(CONFIG.INPUT_DIR).filter(f => f.toLowerCase().endsWith('.svg') && f.toLowerCase().includes('icon'));
  if (svgIcons.length === 0) {
    console.error('Aucun fichier icon trouvé dans /exports pour générer les favicons.');
    return;
  }
  const iconSvg = path.join(CONFIG.INPUT_DIR, svgIcons[0]);
  const faviconSizes = [16, 32, 48];
  const pngBuffers = [];
  for (const size of faviconSizes) {
    const outputPath = path.join(
      CONFIG.OUTPUT_DIR,
      'favicons',
      `favicon-${size}x${size}.png`
    );
    await svgToPng(iconSvg, outputPath, size);
    const buffer = await fs.readFile(outputPath);
    pngBuffers.push(buffer);
    console.log(`  ✓ favicon-${size}x${size}.png`);
  }
  try {
    const icoBuffer = await toIco(pngBuffers);
    const icoPath = path.join(CONFIG.OUTPUT_DIR, 'favicons', 'favicon.ico');
    await fs.writeFile(icoPath, icoBuffer);
    console.log(`  ✓ favicon.ico (multi-size)`);
  } catch (error) {
    console.error('  ❌ Erreur génération favicon.ico:', error.message);
  }
  const appleTouchPath = path.join(CONFIG.OUTPUT_DIR, 'favicons', 'apple-touch-icon.png');
  await svgToPng(iconSvg, appleTouchPath, 180);
  console.log(`  ✓ apple-touch-icon.png`);
  console.log('✅ Favicons générés\n');
}

async function generateOgImages() {
  console.log('📱 Génération des OG images...');
  const svgFiles = fs.readdirSync(CONFIG.INPUT_DIR).filter(f => f.toLowerCase().endsWith('.svg'));
  const logoWhite = svgFiles.find(f => f.toLowerCase().includes('white'));
  const logoBlack = svgFiles.find(f => f.toLowerCase().includes('black'));
  if (!logoWhite || !logoBlack) {
    const msg = '⚠️  Impossible de générer les images OG : il faut au moins un SVG avec "white" et un avec "black" dans le nom dans /exports.';
    console.error(msg);
    if (!global._ogError) global._ogError = msg;
    return;
  }
  const logoWhiteSvg = path.join(CONFIG.INPUT_DIR, logoWhite);
  const logoBlackSvg = path.join(CONFIG.INPUT_DIR, logoBlack);
  const ogDarkPath = path.join(CONFIG.OUTPUT_DIR, 'social', 'og-image-dark.png');
  await createOgImage(logoWhiteSvg, ogDarkPath, CONFIG.OG_BACKGROUNDS.dark);
  console.log(`  ✓ og-image-dark.png`);
  const ogLightPath = path.join(CONFIG.OUTPUT_DIR, 'social', 'og-image-light.png');
  await createOgImage(logoBlackSvg, ogLightPath, CONFIG.OG_BACKGROUNDS.light);
  console.log(`  ✓ og-image-light.png`);
  const twitterPath = path.join(CONFIG.OUTPUT_DIR, 'social', 'twitter-card.png');
  await createOgImage(logoWhiteSvg, twitterPath, CONFIG.OG_BACKGROUNDS.dark, 1200, 600);
  console.log(`  ✓ twitter-card.png`);
  console.log('✅ OG images générées\n');
}

async function createOgImage(logoSvgPath, outputPath, bgColor, width = 1200, height = 630) {
  try {
    const background = sharp({
      create: {
        width: width,
        height: height,
        channels: 4,
        background: bgColor
      }
    }).png();
    const logoWidth = Math.floor(width * 0.6);
    const logoBuffer = await sharp(await fs.readFile(logoSvgPath))
      .resize(logoWidth, null, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    const logoMetadata = await sharp(logoBuffer).metadata();
    const left = Math.floor((width - logoMetadata.width) / 2);
    const top = Math.floor((height - logoMetadata.height) / 2);
    await background
      .composite([{
        input: logoBuffer,
        left: left,
        top: top
      }])
      .toFile(outputPath);
    return true;
  } catch (error) {
    console.error(`  ❌ Erreur création OG image:`, error.message);
    return false;
  }
}

async function generatePoweredBy(svgFiles) {
  console.log('⚡ Génération des versions "Powered by"...');
  const whiteSourceFile = svgFiles.find(f => f.toLowerCase().includes('white'));
  const blackSourceFile = svgFiles.find(f => f.toLowerCase().includes('black'));
  if (!whiteSourceFile || !blackSourceFile) {
    const msg = '⚠️  Impossible de générer les versions "Powered by" : il faut au moins un SVG avec "white" et un avec "black" dans le nom dans /exports.';
    console.error(msg);
    if (!global._poweredByError) global._poweredByError = msg;
    return;
  }
  const whiteSource = path.join(CONFIG.INPUT_DIR, whiteSourceFile);
  const blackSource = path.join(CONFIG.INPUT_DIR, blackSourceFile);
  const whiteDest = path.join(CONFIG.OUTPUT_DIR, 'logos', 'powered-by', 'powered-by-white.svg');
  const blackDest = path.join(CONFIG.OUTPUT_DIR, 'logos', 'powered-by', 'powered-by-black.svg');
  await fs.copy(whiteSource, whiteDest);
  await fs.copy(blackSource, blackDest);
  console.log(`  ✓ powered-by-white.svg`);
  console.log(`  ✓ powered-by-black.svg`);
  const whitePng = path.join(CONFIG.OUTPUT_DIR, 'logos', 'powered-by', 'powered-by-white@2x.png');
  const blackPng = path.join(CONFIG.OUTPUT_DIR, 'logos', 'powered-by', 'powered-by-black@2x.png');
  await svgToPng(whiteSource, whitePng, CONFIG.SIZES.POWERED_BY.width, CONFIG.SIZES.POWERED_BY.height);
  await svgToPng(blackSource, blackPng, CONFIG.SIZES.POWERED_BY.width, CONFIG.SIZES.POWERED_BY.height);
  console.log(`  ✓ powered-by-white@2x.png`);
  console.log(`  ✓ powered-by-black@2x.png`);
  console.log('✅ Versions "Powered by" générées\n');
}

async function generatePrintVersions(svgFiles) {
  console.log('🖨️  Génération des versions print...');
  const logoSvg = svgFiles.find(f => f.toLowerCase().includes('logo')) || svgFiles[0];
  if (!logoSvg) {
    console.error('Aucun fichier logo trouvé pour le print.');
    return;
  }
  const logoSvgPath = path.join(CONFIG.INPUT_DIR, logoSvg);
  const transparentPath = path.join(CONFIG.OUTPUT_DIR, 'print', 'logo-print-transparent.png');
  await svgToPng(logoSvgPath, transparentPath, CONFIG.SIZES.LOGO_RETINA.width, CONFIG.SIZES.LOGO_RETINA.height);
  console.log('  ✓ logo-print-transparent.png');
  const whiteBgPath = path.join(CONFIG.OUTPUT_DIR, 'print', 'logo-print-whitebg.png');
  await sharp(await fs.readFile(logoSvgPath))
    .resize(CONFIG.SIZES.LOGO_RETINA.width, CONFIG.SIZES.LOGO_RETINA.height, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(whiteBgPath);
  console.log('  ✓ logo-print-whitebg.png');
  const blackBgPath = path.join(CONFIG.OUTPUT_DIR, 'print', 'logo-print-blackbg.png');
  await sharp(await fs.readFile(logoSvgPath))
    .resize(CONFIG.SIZES.LOGO_RETINA.width, CONFIG.SIZES.LOGO_RETINA.height, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
    .png()
    .toFile(blackBgPath);
  console.log('  ✓ logo-print-blackbg.png');
  // Export du logo color (black et white)
  const logoColorBlackSvg = svgFiles.find(f => f.toLowerCase().includes('full-color-black'));
  const logoColorWhiteSvg = svgFiles.find(f => f.toLowerCase().includes('full-color-white'));
  if (logoColorBlackSvg) {
    const logoColorBlackSvgPath = path.join(CONFIG.INPUT_DIR, logoColorBlackSvg);
    const colorBlackTransparentPath = path.join(CONFIG.OUTPUT_DIR, 'print', 'logo-print-color-black-transparent.png');
    await svgToPng(logoColorBlackSvgPath, colorBlackTransparentPath, CONFIG.SIZES.LOGO_RETINA.width, CONFIG.SIZES.LOGO_RETINA.height);
    console.log('  ✓ logo-print-color-black-transparent.png');
    const colorBlackWhiteBgPath = path.join(CONFIG.OUTPUT_DIR, 'print', 'logo-print-color-black-whitebg.png');
    await sharp(await fs.readFile(logoColorBlackSvgPath))
      .resize(CONFIG.SIZES.LOGO_RETINA.width, CONFIG.SIZES.LOGO_RETINA.height, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(colorBlackWhiteBgPath);
    console.log('  ✓ logo-print-color-black-whitebg.png');
    const colorBlackBlackBgPath = path.join(CONFIG.OUTPUT_DIR, 'print', 'logo-print-color-black-blackbg.png');
    await sharp(await fs.readFile(logoColorBlackSvgPath))
      .resize(CONFIG.SIZES.LOGO_RETINA.width, CONFIG.SIZES.LOGO_RETINA.height, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
      .png()
      .toFile(colorBlackBlackBgPath);
    console.log('  ✓ logo-print-color-black-blackbg.png');
  }
  if (logoColorWhiteSvg) {
    const logoColorWhiteSvgPath = path.join(CONFIG.INPUT_DIR, logoColorWhiteSvg);
    const colorWhiteTransparentPath = path.join(CONFIG.OUTPUT_DIR, 'print', 'logo-print-color-white-transparent.png');
    await svgToPng(logoColorWhiteSvgPath, colorWhiteTransparentPath, CONFIG.SIZES.LOGO_RETINA.width, CONFIG.SIZES.LOGO_RETINA.height);
    console.log('  ✓ logo-print-color-white-transparent.png');
    const colorWhiteWhiteBgPath = path.join(CONFIG.OUTPUT_DIR, 'print', 'logo-print-color-white-whitebg.png');
    await sharp(await fs.readFile(logoColorWhiteSvgPath))
      .resize(CONFIG.SIZES.LOGO_RETINA.width, CONFIG.SIZES.LOGO_RETINA.height, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(colorWhiteWhiteBgPath);
    console.log('  ✓ logo-print-color-white-whitebg.png');
    const colorWhiteBlackBgPath = path.join(CONFIG.OUTPUT_DIR, 'print', 'logo-print-color-white-blackbg.png');
    await sharp(await fs.readFile(logoColorWhiteSvgPath))
      .resize(CONFIG.SIZES.LOGO_RETINA.width, CONFIG.SIZES.LOGO_RETINA.height, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
      .png()
      .toFile(colorWhiteBlackBgPath);
    console.log('  ✓ logo-print-color-white-blackbg.png');
  }
  console.log('✅ Versions print générées\n');
}

async function generateReport() {
  let report = `\n╔════════════════════════════════════════════════════════════════╗\n║              🎉 EXPORT TERMINÉ AVEC SUCCÈS !                   ║\n╚════════════════════════════════════════════════════════════════╝\n\n📦 Fichiers générés dans /output:\n\n📁 logos/\n  └─ full/\n     ...\n  └─ icon/\n     ...\n  └─ powered-by/\n     ...\n🌐 favicons/\n  ...\n📱 social/\n  ...\n🖨️ print/\n  ...\n\n═══════════════════════════════════════════════════════════════\n`;
  if (global._ogError) {
    report += `\n${global._ogError}\n`;
  }
  if (global._poweredByError) {
    report += `\n${global._poweredByError}\n`;
  }
  report += `\n💡 Prochaines étapes:\n  1. Copie les fichiers nécessaires dans ton projet\n  2. Référence les favicons dans ton <head>\n  3. Configure les meta OG dans ton HTML\n  4. Envoie les versions print à l'organisateur\n  \n📖 Documentation: Voir README.md pour l'intégration\n\n═══════════════════════════════════════════════════════════════\n`;
  console.log(report);
  await fs.writeFile(
    path.join(CONFIG.OUTPUT_DIR, 'EXPORT_REPORT.txt'),
    report
  );
}

async function main() {
  console.log(`\n╔════════════════════════════════════════════════════════════════╗\n║        🚀 BRAND ASSETS EXPORTER                                ║\n╚════════════════════════════════════════════════════════════════╝\n  `);
  try {
    const svgFiles = getSvgFiles();
    await createOutputStructure();
    await copySvgSources(svgFiles);
    await generateLogoPngs(svgFiles);
    await generateIcons();
    await generateFavicons();
    await generateOgImages();
    await generatePoweredBy(svgFiles);
    await generatePrintVersions(svgFiles);
    await generateReport();
  } catch (error) {
    console.error('\n❌ ERREUR CRITIQUE:', error);
    process.exit(1);
  }
}

main();
