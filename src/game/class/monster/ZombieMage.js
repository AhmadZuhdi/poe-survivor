import { BaseMonster } from './base_monster.js';
export class ZombieMageMonster extends BaseMonster {
    constructor() {
        super({
            name: 'Zombie Mage',
            health: 40,
            startDamage: 8,
            endDamage: 12,
            armor: 2,
            fireResist: 0,
            coldResist: 0,
            lightningResist: 0,
            chaosResist: 0,
            evasion: 1,
            range: 4
        });
    }

    // Override visual generation for Zombie Mage
    generateVisual(scene, x, y) {
        // Create a purple/magical zombie mage visual
        const graphics = scene.make.graphics({x: 0, y: 0, add: false});
        
        // Main body - dark purple
        graphics.fillStyle(0x4a1a4a, 1);
        graphics.fillCircle(15, 15, 15);
        
        // Add magical robe pattern - lighter purple
        graphics.fillStyle(0x6b2d6b, 1);
        graphics.fillCircle(15, 20, 8);
        
        // Add magical aura/energy - cyan glow
        graphics.fillStyle(0x00ffff, 0.6);
        graphics.fillCircle(15, 15, 18);
        
        // Add glowing eyes - bright blue
        graphics.fillStyle(0x00aaff, 1);
        graphics.fillCircle(12, 12, 2);
        graphics.fillCircle(18, 12, 2);
        
        // Add a magical staff or crystal - yellow
        graphics.fillStyle(0xffff00, 1);
        graphics.fillRect(8, 5, 2, 8);
        graphics.fillCircle(9, 5, 3);
        
        graphics.generateTexture(this.getTextureKey(), 36, 36); // Slightly larger for the aura
        graphics.destroy();
        
        return scene.physics.add.sprite(x, y, this.getTextureKey());
    }
}