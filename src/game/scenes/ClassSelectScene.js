import { Scene } from 'phaser';
import { ClassSelectPanel } from '../ui/ClassSelectPanel';
import {Axes} from './../class/weapons/axes/axes.js'
import {Sceptres} from './../class/weapons/sceptres/screptres.js'

export class ClassSelectScene extends Scene {
    constructor() {
        super('ClassSelectScene');

        this.startingWeapons = [Axes.RustedHatchet, Sceptres.DriftwoodSceptre];
    }

    create() {
        // Add fullscreen background
        this.add.rectangle(
            this.scale.width / 2,
            this.scale.height / 2,
            this.scale.width,
            this.scale.height,
            0x222244
        );

        this.selectedClass = null;
        this.selectedWeapon = null;
        this.weaponPanel = null;
        // Center and size ClassSelectPanel for fullscreen experience
        this.classPanel = new ClassSelectPanel(this, (cls) => {
            this.selectedClass = cls;
            // Show weapon selection panel
            this.showWeaponPanel();
        });
    }

    showWeaponPanel() {
        // Remove/hide class panel safely
        if (this.classPanel.bg && typeof this.classPanel.bg.setVisible === 'function') {
            this.classPanel.bg.setVisible(false);
        }
        if (this.classPanel.title && typeof this.classPanel.title.setVisible === 'function') {
            this.classPanel.title.setVisible(false);
        }
        if (Array.isArray(this.classPanel.options)) {
            this.classPanel.options.forEach(opt => {
                if (opt && typeof opt.setVisible === 'function') {
                    opt.setVisible(false);
                }
            });
        }
        // If the panel has a hide method, call it
        if (typeof this.classPanel.hide === 'function') {
            this.classPanel.hide();
        }

        // Create weapon selection panel
        const panelWidth = 400;
        const panelHeight = 320;
        const panelX = this.scale.width / 2 - panelWidth / 2;
        const panelY = this.scale.height / 2 - panelHeight / 2;
        this.weaponPanelBg = this.add.rectangle(
            this.scale.width / 2,
            this.scale.height / 2,
            panelWidth,
            panelHeight,
            0x444444,
            0.98
        ).setDepth(210);
        this.weaponPanelTitle = this.add.text(
            this.scale.width / 2,
            panelY + 24,
            'Select Your Weapon',
            { fontFamily: 'Arial', fontSize: 32, color: '#ffff88', stroke: '#000', strokeThickness: 3 }
        ).setOrigin(0.5, 0).setDepth(211);

        // List available weapons
        const weapons = this.startingWeapons;
        this.weaponPanelOptions = weapons.map((weapon, i) => {
            const btn = this.add.text(
                this.scale.width / 2,
                panelY + 80 + i * 60,
                weapon.name || weapon,
                { fontFamily: 'Arial', fontSize: 28, color: '#ffffff', backgroundColor: '#222', padding: { left: 16, right: 16, top: 8, bottom: 8 } }
            ).setOrigin(0.5, 0).setDepth(212).setInteractive({ useHandCursor: true });
            btn.on('pointerdown', () => {
                this.selectedWeapon = weapon;
                this.startBattleScene();
            });
            btn.on('pointerover', () => btn.setStyle({ color: '#ffff88' }));
            btn.on('pointerout', () => btn.setStyle({ color: '#ffffff' }));
            return btn;
        });
    }

    startBattleScene() {
        // Remove weapon panel
        this.weaponPanelBg.destroy();
        this.weaponPanelTitle.destroy();
        this.weaponPanelOptions.forEach(opt => opt.destroy());
        // Start battle scene with selected class and weapon
        this.scene.start('BattleScene', { selectedClass: this.selectedClass, selectedWeapon: this.selectedWeapon });
    }
}
