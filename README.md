
# PoE Survivor: Phaser Auto-Battler Game

PoE Survivor is a Phaser 3 auto-battler game with React overlays, featuring:

- **Auto-attack and enemy waves**: Survive against endless waves of enemies with automatic attacks and projectile/cone-based melee.
- **Class selection**: Choose your character class, each with unique stats and starting equipment.
- **Skill tree with skill points**: Unlock skills using points earned from leveling up. Visual skill tree panel with node connections and stat preview.
- **Inventory and equipment panel**: Manage your gear with drag-and-drop, tooltips, and equipment slots for weapon, armor, helm, gloves, boots, and more.
- **Cone-shaped melee attacks**: Melee weapons attack in a cone area, with visual feedback and direction toward nearest enemy.
- **Experience and leveling**: Gain experience, level up, and earn skill points to unlock new skills.
- **Modular UI panels**: Character stats, skill tree, and inventory panels, all openable/closable and pausing gameplay as needed.
- **React + Phaser integration**: UI overlays and event bus for communication between React and Phaser game logic.

![screenshot](screenshot.png)

## TODO
- [ ] implement attack speed
- [ ] implement increase max life
- [ ] implement regen life
- [ ] implement pick skill based on connected skill
- [ ] implement enemy attack rather than insta reduce damage
- [ ] and lot more

## Requirements

- [Node.js](https://nodejs.org) for dependency management and running scripts

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

## Project Structure

| Path                          | Description                                                                 |
|-------------------------------|-----------------------------------------------------------------------------|
| `index.html`                  | Main HTML page for the game.                                                |
| `src/`                        | React and Phaser source code.                                               |
| `src/main.jsx`                | React entry point.                                                          |
| `src/App.jsx`                 | Main React component.                                                       |
| `src/PhaserGame.jsx`          | React bridge to Phaser game instance.                                       |
| `src/game/`                   | Phaser game source code.                                                    |
| `src/game/main.jsx`           | Phaser game entry point.                                                    |
| `src/game/scenes/`            | Phaser scenes (BattleScene, etc).                                           |
| `src/game/ui/`                | UI panels (CharacterPanel, SkillTreePanel, InventoryPanel, etc).            |
| `public/assets/`              | Static assets (images, icons, etc).                                         |

## Features

- Auto-battler gameplay with waves and boss spawns
- Class selection and stat-based progression
- Skill tree with unlockable nodes and skill point system
- Inventory management with drag-and-drop and tooltips
- Equipment slots for gear and weapons
- Cone-shaped melee attacks and ranged projectiles
- Experience, leveling, and skill point rewards
- Modular UI panels for character, skills, and inventory
- React-powered overlays and event bus for communication

## Customization & Extensibility

- Add new classes, skills, or equipment by editing the relevant JSON/config files and UI panels.
- Extend scenes and game logic in `src/game/scenes/`.
- Customize UI overlays in `src/game/ui/`.

## License

MIT License. See LICENSE file for details.
