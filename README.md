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
## Structure attendue et nommage des fichiers

Pour que le script fonctionne correctement, placez vos fichiers SVG dans le dossier `exports/` en respectant les conventions suivantes :

- **Logos complets** : nom contenant `white`, `black` ou `color` (ex : `brand-full-white.svg`, `brand-full-black.svg`, `brand-full-color.svg`)
- **Icons** : nom contenant `icon` (ex : `brand-icon-color.svg`)
- **Images OG et Twitter** : il faut au moins un SVG avec `white` et un avec `black` dans le nom
- **Versions "Powered by"** : il faut au moins un SVG avec `white` et un avec `black` dans le nom
- **Versions print color** : fichiers avec `full-color-black` et `full-color-white` dans le nom

Exemple de structure :

```
exports/
├── brand-full-white.svg
├── brand-full-black.svg
├── brand-full-color.svg
├── brand-icon-color.svg
```

Le script génère ensuite un dossier `/output` avec une arborescence organisée (logos, icons, favicons, social, print, rapport d'export).

Si certains fichiers sont absents ou mal nommés, certains exports ne seront pas générés.

## Conseils pour l'export depuis Figma/Illustrator
- Groupez chaque variante de logo et nommez-les selon la convention ci-dessus
- Exportez en SVG et placez-les dans `exports/`

## Dépannage
- Vérifiez que Node.js est installé (`node --version`)
- Vérifiez la présence et le nommage des fichiers SVG dans `exports/`
- Lisez les messages d'erreur du script pour identifier les fichiers manquants


## Personnalisation
- Modifiez la configuration dans `export-assets.js` pour adapter les tailles ou formats.

## Licence
MIT

## Auteur
Projet open source, contributions bienvenues !
Fait avec ❤️ par QuantumCrafter
