import Phaser from 'phaser';

export class ClassSelectPanel extends Phaser.GameObjects.Container {
    constructor(scene, onSelect) {
        super(scene, 0, 0);
        this.setDepth(300);
        this.width = scene.scale.width;
        this.height = scene.scale.height;
        this.scene = scene;
        this.onSelect = onSelect;
        this.visible = true;
        scene.add.existing(this);

        // Background overlay
        this.bg = scene.add.graphics();
        this.bg.fillStyle(0x222244, 0.97);
        this.bg.fillRect(0, 0, this.width, this.height);
        this.add(this.bg);

        // Load classes from SkillTree.json
        this.loadClasses();
    }

    async loadClasses() {
        const response = await fetch('SkillTree.json');
        const data = await response.json();
        const classes = data.classes || [];
        this.renderClassOptions(classes);
    }

    renderClassOptions(classes) {
        // Display class names as buttons
        const startY = this.height / 2 - (classes.length * 40) / 2;
        classes.forEach((cls, i) => {
            const y = startY + i * 60;
            const btn = this.scene.add.text(this.width / 2, y, cls.name || `Class ${i+1}`,
                { fontFamily: 'Arial', fontSize: 32, color: '#fff', stroke: '#000', strokeThickness: 4 })
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true });
            btn.on('pointerdown', () => {
                this.visible = false;
                this.onSelect(cls);
                this.destroy();
            });
            this.add(btn);
        });
    }
}
