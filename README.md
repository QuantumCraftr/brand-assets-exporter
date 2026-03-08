# BrandAssetsExporter

Outil Node.js pour exporter automatiquement des logos et assets de marque en plusieurs formats (SVG, PNG, ICO, OG, print, etc.) à partir de fichiers SVG.

## Fonctionnalités
- Génère des logos en PNG (multi-tailles, retina, print, color, mono)
- Exporte des icônes, favicons, Apple touch icons
- Crée des images OG et Twitter Card
- Versions print (fond transparent, blanc, noir)
- Structure de dossiers claire
- Rapport d’export automatique

## Prérequis
- Node.js >= 14
- Placez vos fichiers SVG dans le dossier `exports/`

## Installation
```
npm install
```

## Utilisation
```
node export-assets.js
```

Les fichiers générés seront dans le dossier `output/`.

## Personnalisation
- Modifiez la configuration dans `export-assets.js` pour adapter les tailles ou formats.

## Licence
MIT

## Auteur
Projet open source, contributions bienvenues !
Fait avec ❤️ par QuantumCrafter
