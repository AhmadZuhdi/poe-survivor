import { BaseMonster } from './base_monster.js';
export class ZombieMonster extends BaseMonster {
    constructor() {
        super({
            name: 'Zombie',
            health: 50,
            startDamage: 5,
            endDamage: 10,
            armor: 2,
            fireResist: 0,
            coldResist: 0,
            lightningResist: 0,
            chaosResist: 0,
            evasion: 1,
            range: 1
        });
    }

    // Override visual generation for Zombie
    generateVisual(scene, x, y) {
        // Create a greenish zombie visual
        const graphics = scene.make.graphics({x: 0, y: 0, add: false});
        
        // Main body - dark green
        graphics.fillStyle(0x2d5016, 1);
        graphics.fillCircle(15, 15, 15);
        
        // Add some darker spots for zombie texture
        graphics.fillStyle(0x1a3009, 1);
        graphics.fillCircle(10, 10, 4);
        graphics.fillCircle(20, 12, 3);
        graphics.fillCircle(12, 20, 3);
        
        // Add red eyes
        graphics.fillStyle(0xff0000, 1);
        graphics.fillCircle(12, 12, 2);
        graphics.fillCircle(18, 12, 2);
        
        graphics.generateTexture(this.getTextureKey(), 30, 30);
        graphics.destroy();
        
        return scene.physics.add.sprite(x, y, this.getTextureKey());
    }
}