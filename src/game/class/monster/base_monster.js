export class BaseMonster {
    constructor(config) {
        this.name = config.name;
        this.health = config.health;
        this.startDamage = config.startDamage;
        this.endDamage = config.endDamage;
        this.range = config.range || 1; // default melee

        this.armor = config.armor || 0;
        this.fireResist = config.fireResist || 0;
        this.coldResist = config.coldResist || 0;
        this.lightningResist = config.lightningResist || 0;
        this.chaosResist = config.chaosResist || 0;
        this.evasion = config.evasion || 0;
    }

    // calculate damage within the monster's damage range
    calculateDamage() {
        const damage = Math.random() * (this.endDamage - this.startDamage) + this.startDamage;
        return damage;
    }

    // Generate visual appearance for the monster
    // Override this method in subclasses for custom visuals
    generateVisual(scene, x, y) {
        // Default monster visual - simple red circle
        const graphics = scene.make.graphics({x: 0, y: 0, add: false});
        graphics.fillStyle(0xff0000, 1); // Red color
        graphics.fillCircle(15, 15, 15); // 30x30 circle
        graphics.generateTexture(this.getTextureKey(), 30, 30);
        graphics.destroy();
        
        return scene.physics.add.sprite(x, y, this.getTextureKey());
    }

    // Get unique texture key for this monster type
    getTextureKey() {
        return `monster_${this.name.toLowerCase().replace(/\s+/g, '_')}`;
    }
}