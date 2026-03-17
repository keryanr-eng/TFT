# Animal Autochess

Base moderne pour un autochess jouable sur navigateur, inspire des mecaniques de Teamfight Tactics mais avec un univers original d'animaux combattants.

Cette premiere passe construit volontairement le socle:

- stack Vite + React + TypeScript + Tailwind CSS
- architecture modulaire claire
- types TypeScript de domaine
- import des donnees depuis `AC_cleaned_v1.xlsx`
- modules `unitData.ts`, `synergyData.ts`, `itemData.ts`
- UI de prototype lisible pour visualiser board, bench, shop, HUD et synergies

Les systemes complets de combat, economy, bots et rounds sont encore au stade de base/stub et sont prets pour l'implementation suivante.

## Lancer le projet

1. Installer les dependances:

```powershell
npm.cmd install
```

2. Exporter les donnees de design depuis le classeur Excel:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\export-design-data.ps1 -WorkbookPath "C:\Users\kerya\Downloads\AC_cleaned_v1.xlsx"
```

3. Demarrer le serveur local:

```powershell
npm.cmd run dev
```

## Structure du projet

```text
src/
  assets/
  data/
    raw/
    itemData.ts
    progressionData.ts
    scopeData.ts
    synergyData.ts
    unitData.ts
  engine/
    combatEngine.ts
    movementSystem.ts
    targetingSystem.ts
  game/
    botAI.ts
    gameLoop.ts
    playerManager.ts
    roundManager.ts
  store/
    gameStore.ts
  systems/
    economySystem.ts
    itemSystem.ts
    levelSystem.ts
    shopSystem.ts
    synergySystem.ts
  types/
    gameTypes.ts
  ui/
    components/
      Bench.tsx
      Board.tsx
      HUD.tsx
      Shop.tsx
      SynergyPanel.tsx
      UnitCard.tsx
  utils/
scripts/
  export-design-data.ps1
```

## Modifier les unites

- Source principale: onglet `Unites V1` du classeur Excel.
- Apres modification du classeur, relancer `export-design-data.ps1`.
- Les donnees brutes generees arrivent dans [src/data/raw/units.v1.json](C:/Users/kerya/Documents/TFT/src/data/raw/units.v1.json).
- La normalisation typee se fait dans [src/data/unitData.ts](C:/Users/kerya/Documents/TFT/src/data/unitData.ts).
- Les stats de combat sont actuellement derivees par heuristique a partir du cout et du role, car le classeur ne fournit pas encore une feuille de balance complete.

## Modifier les synergies

- Source principale: onglet `Synergies V1`.
- Reexporter les donnees apres changement du classeur.
- Les lignes brutes vont dans [src/data/raw/synergies.v1.json](C:/Users/kerya/Documents/TFT/src/data/raw/synergies.v1.json).
- Les breakpoints et scripts de synergie sont normalises dans [src/data/synergyData.ts](C:/Users/kerya/Documents/TFT/src/data/synergyData.ts).

## Modifier les items

- Source principale: onglet `Items V1`.
- Reexporter les donnees apres changement du classeur.
- Les composants et recettes sont centralises dans [src/data/itemData.ts](C:/Users/kerya/Documents/TFT/src/data/itemData.ts).
- Le helper de combinaison initial se trouve dans [src/systems/itemSystem.ts](C:/Users/kerya/Documents/TFT/src/systems/itemSystem.ts).

## Build

```powershell
npm.cmd run build
```

## Deploy GitHub Pages

Le build utilise `VITE_BASE_PATH` pour eviter de figer le nom du repo.

Exemple si le repo GitHub Pages est `TFT`:

```powershell
$env:VITE_BASE_PATH="/TFT/"
npm.cmd run build
```

Ensuite deployer le contenu de `dist/` sur GitHub Pages.

## Notes d'architecture

- Les donnees de design sont separees du moteur.
- Les types de domaine sont centralises dans [src/types/gameTypes.ts](C:/Users/kerya/Documents/TFT/src/types/gameTypes.ts).
- Les systemes sont deja decoupes par responsabilite pour eviter un gros fichier monolithique.
- Le store Zustand sert de couche de presentation pour la demo actuelle, sans bloquer le futur moteur de simulation.

## V2

- Multijoueur avec room code
- Augments
- Meilleurs bots
- Nouveaux items
- Nouvelles unites
- Effets visuels avances
- Sons
- Equilibrage
