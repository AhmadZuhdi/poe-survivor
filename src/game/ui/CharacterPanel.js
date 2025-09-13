import Phaser from 'phaser';

export class CharacterPanel extends Phaser.GameObjects.Container {
    constructor(scene) {
        // Full screen overlay
        const width = scene.scale.width;
        const height = scene.scale.height;
        super(scene, 0, 0);
        this.setDepth(200);
        this.width = width;
        this.height = height;
        // Background overlay
        this.bg = scene.add.graphics();
        this.bg.fillStyle(0x222244, 0.97);
        this.bg.fillRect(0, 0, width, height);
        this.add(this.bg);
        // Centered stats text
        this.text = scene.add.text(width / 2, height / 2, '', {
            fontFamily: 'Arial', fontSize: 32, color: '#fff', stroke: '#000', strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5);
        this.add(this.text);
        this.visible = false;
        scene.add.existing(this);
    }

    updateStats(stats) {
        let classText = '';
        if (stats.selectedClass) {
            classText = `Class: ${stats.selectedClass.name || stats.selectedClass}`;
        }
        this.text.setText(
            `${classText ? classText + '\n' : ''}Level: ${stats.level}\nEXP: ${stats.exp}/${stats.expToLevel}\nKills: ${stats.kills}\nHealth: ${stats.health}/${stats.maxHealth}`
        );
    }

    open(stats) {
        this.updateStats(stats);
        this.visible = true;
    }

    close() {
        this.visible = false;
    }

    toggle(stats) {
        if (this.visible) {
            this.close();
        } else {
            this.open(stats);
        }
    }
}
