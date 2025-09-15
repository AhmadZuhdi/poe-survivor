import Phaser from 'phaser';

export class SkillPanel extends Phaser.GameObjects.Container {
    constructor(scene) {
        super(scene, 0, 0);
        
        const width = scene.scale.width;
        const height = scene.scale.height;
        this.setDepth(200);
        this.width = width;
        this.height = height;
        this.scene = scene;
        this.visible = false;
        scene.add.existing(this);

        // Background overlay
        this.bg = scene.add.graphics();
        this.bg.fillStyle(0x000033, 0.95);
        this.bg.fillRect(0, 0, width, height);
        this.bg.setScrollFactor?.(0);
        this.add(this.bg);

        // Panel container dimensions
        const panelWidth = Math.min(800, width * 0.8);
        const panelHeight = Math.min(600, height * 0.8);
        const panelX = (width - panelWidth) / 2;
        const panelY = (height - panelHeight) / 2;

        // Main panel background
        this.panelBg = scene.add.graphics();
        this.panelBg.fillStyle(0x2d3748, 1);
        this.panelBg.lineStyle(3, 0x4a5568);
        this.panelBg.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 8);
        this.panelBg.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 8);
        this.add(this.panelBg);

        // Title
        this.titleText = scene.add.text(width / 2, panelY + 20, 'Skills', {
            fontFamily: 'Arial', fontSize: 24, color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5, 0).setDepth(201);
        this.add(this.titleText);

        // Divider line (vertical)
        const dividerX = width / 2;
        this.divider = scene.add.graphics();
        this.divider.lineStyle(2, 0x4a5568);
        this.divider.lineBetween(dividerX, panelY + 60, dividerX, panelY + panelHeight - 20);
        this.add(this.divider);

        // Left section - Activated Skills
        const leftX = panelX + 20;
        const leftWidth = (panelWidth / 2) - 30;
        
        this.activatedTitleText = scene.add.text(leftX + leftWidth / 2, panelY + 60, 'Active Skills', {
            fontFamily: 'Arial', fontSize: 18, color: '#68d391', fontStyle: 'bold'
        }).setOrigin(0.5, 0).setDepth(201);
        this.add(this.activatedTitleText);

        // Right section - Available Skills
        const rightX = dividerX + 20;
        const rightWidth = (panelWidth / 2) - 30;

        this.availableTitleText = scene.add.text(rightX + rightWidth / 2, panelY + 60, 'Available Skills', {
            fontFamily: 'Arial', fontSize: 18, color: '#63b3ed', fontStyle: 'bold'
        }).setOrigin(0.5, 0).setDepth(201);
        this.add(this.availableTitleText);

        // Skill containers
        this.activatedSkills = [];
        this.availableSkills = [];
        
        // Store panel dimensions for skill positioning
        this.panelBounds = {
            x: panelX,
            y: panelY,
            width: panelWidth,
            height: panelHeight,
            leftX: leftX,
            leftWidth: leftWidth,
            rightX: rightX,
            rightWidth: rightWidth,
            contentY: panelY + 100
        };

        // Initialize with default skills
        this.initializeSkills();

        // Close button
        this.closeButton = scene.add.text(panelX + panelWidth - 30, panelY + 15, '×', {
            fontFamily: 'Arial', fontSize: 28, color: '#ff6b6b', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(201).setInteractive({ useHandCursor: true });
        
        this.closeButton.on('pointerdown', () => {
            this.setVisible(false);
        });
        
        this.closeButton.on('pointerover', () => {
            this.closeButton.setColor('#ff4757');
        });
        
        this.closeButton.on('pointerout', () => {
            this.closeButton.setColor('#ff6b6b');
        });
        
        this.add(this.closeButton);

        // Make panel interactive to prevent clicks from going through
        this.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);
        this.on('pointerdown', (pointer, localX, localY, event) => {
            // Stop event propagation if clicking on the panel
            const bounds = this.panelBounds;
            if (localX >= bounds.x && localX <= bounds.x + bounds.width &&
                localY >= bounds.y && localY <= bounds.y + bounds.height) {
                event.stopPropagation();
            } else {
                // Click outside panel to close
                this.setVisible(false);
            }
        });
    }

    initializeSkills() {
        // Sample activated skills
        this.addActivatedSkill({
            name: 'Basic Attack',
            key: 'LMB',
            description: 'Default melee attack',
            manaCost: 0,
            cooldown: 500
        });

        // Sample available skills
        this.addAvailableSkill({
            name: 'Sunder',
            description: 'Powerful area attack that damages enemies in a cone',
            manaCost: 5,
            cooldown: 1000,
            tags: ['melee', 'physical', 'area', 'weapon']
        });

        this.addAvailableSkill({
            name: 'Fireball',
            description: 'Launch a projectile that explodes on impact',
            manaCost: 8,
            cooldown: 800,
            tags: ['spell', 'fire', 'projectile']
        });

        this.addAvailableSkill({
            name: 'Shield Bash',
            description: 'Stun enemies and deal damage',
            manaCost: 3,
            cooldown: 1200,
            tags: ['melee', 'physical', 'stun']
        });
    }

    addActivatedSkill(skillData) {
        const index = this.activatedSkills.length;
        const bounds = this.panelBounds;
        const skillY = bounds.contentY + (index * 80);

        // Skill container background
        const skillBg = this.scene.add.graphics();
        skillBg.fillStyle(0x1a202c, 0.8);
        skillBg.lineStyle(1, 0x68d391);
        skillBg.fillRoundedRect(bounds.leftX, skillY, bounds.leftWidth, 70, 4);
        skillBg.strokeRoundedRect(bounds.leftX, skillY, bounds.leftWidth, 70, 4);
        this.add(skillBg);

        // Skill name and key binding
        const nameText = this.scene.add.text(bounds.leftX + 10, skillY + 10, `${skillData.name}`, {
            fontFamily: 'Arial', fontSize: 16, color: '#ffffff', fontStyle: 'bold'
        }).setDepth(201);
        this.add(nameText);

        const keyText = this.scene.add.text(bounds.leftX + bounds.leftWidth - 10, skillY + 10, skillData.key, {
            fontFamily: 'Arial', fontSize: 14, color: '#68d391'
        }).setOrigin(1, 0).setDepth(201);
        this.add(keyText);

        // Description
        const descText = this.scene.add.text(bounds.leftX + 10, skillY + 35, skillData.description, {
            fontFamily: 'Arial', fontSize: 12, color: '#a0aec0',
            wordWrap: { width: bounds.leftWidth - 20 }
        }).setDepth(201);
        this.add(descText);

        // Stats
        const statsText = this.scene.add.text(bounds.leftX + 10, skillY + 50, 
            `Mana: ${skillData.manaCost} | Cooldown: ${skillData.cooldown}ms`, {
            fontFamily: 'Arial', fontSize: 10, color: '#718096'
        }).setDepth(201);
        this.add(statsText);

        this.activatedSkills.push({
            data: skillData,
            elements: [skillBg, nameText, keyText, descText, statsText]
        });
    }

    addAvailableSkill(skillData) {
        const index = this.availableSkills.length;
        const bounds = this.panelBounds;
        const skillY = bounds.contentY + (index * 80);

        // Skill container background
        const skillBg = this.scene.add.graphics();
        skillBg.fillStyle(0x1a202c, 0.8);
        skillBg.lineStyle(1, 0x63b3ed);
        skillBg.fillRoundedRect(bounds.rightX, skillY, bounds.rightWidth, 70, 4);
        skillBg.strokeRoundedRect(bounds.rightX, skillY, bounds.rightWidth, 70, 4);
        skillBg.setInteractive(new Phaser.Geom.Rectangle(bounds.rightX, skillY, bounds.rightWidth, 70), 
                               Phaser.Geom.Rectangle.Contains);
        this.add(skillBg);

        // Skill name
        const nameText = this.scene.add.text(bounds.rightX + 10, skillY + 10, skillData.name, {
            fontFamily: 'Arial', fontSize: 16, color: '#ffffff', fontStyle: 'bold'
        }).setDepth(201);
        this.add(nameText);

        // Description
        const descText = this.scene.add.text(bounds.rightX + 10, skillY + 30, skillData.description, {
            fontFamily: 'Arial', fontSize: 12, color: '#a0aec0',
            wordWrap: { width: bounds.rightWidth - 20 }
        }).setDepth(201);
        this.add(descText);

        // Stats and tags
        const statsText = this.scene.add.text(bounds.rightX + 10, skillY + 50, 
            `Mana: ${skillData.manaCost} | CD: ${skillData.cooldown}ms`, {
            fontFamily: 'Arial', fontSize: 10, color: '#718096'
        }).setDepth(201);
        this.add(statsText);

        const tagsText = this.scene.add.text(bounds.rightX + bounds.rightWidth - 10, skillY + 50, 
            skillData.tags ? skillData.tags.join(', ') : '', {
            fontFamily: 'Arial', fontSize: 9, color: '#4a5568'
        }).setOrigin(1, 0).setDepth(201);
        this.add(tagsText);

        // Hover effects
        skillBg.on('pointerover', () => {
            skillBg.clear();
            skillBg.fillStyle(0x2d3748, 0.9);
            skillBg.lineStyle(2, 0x90cdf4);
            skillBg.fillRoundedRect(bounds.rightX, skillY, bounds.rightWidth, 70, 4);
            skillBg.strokeRoundedRect(bounds.rightX, skillY, bounds.rightWidth, 70, 4);
        });

        skillBg.on('pointerout', () => {
            skillBg.clear();
            skillBg.fillStyle(0x1a202c, 0.8);
            skillBg.lineStyle(1, 0x63b3ed);
            skillBg.fillRoundedRect(bounds.rightX, skillY, bounds.rightWidth, 70, 4);
            skillBg.strokeRoundedRect(bounds.rightX, skillY, bounds.rightWidth, 70, 4);
        });

        skillBg.on('pointerdown', () => {
            this.equipSkill(skillData);
        });

        this.availableSkills.push({
            data: skillData,
            elements: [skillBg, nameText, descText, statsText, tagsText]
        });
    }

    equipSkill(skillData) {
        // TODO: Implement skill equipping logic
        console.log('Equipping skill:', skillData.name);
        
        // For now, just show a message
        const messageText = this.scene.add.text(this.scene.scale.width / 2, this.scene.scale.height / 2, 
            `Equipped: ${skillData.name}`, {
            fontFamily: 'Arial', fontSize: 20, color: '#68d391', backgroundColor: '#1a202c',
            padding: { left: 10, right: 10, top: 5, bottom: 5 }
        }).setOrigin(0.5).setDepth(300);

        this.scene.time.delayedCall(1500, () => {
            messageText.destroy();
        });
    }

    setVisible(visible) {
        super.setVisible(visible);
        
        // Show/hide all child elements
        this.list.forEach(child => {
            if (child.setVisible) {
                child.setVisible(visible);
            }
        });

        return this;
    }

    destroy() {
        // Clean up all elements
        this.activatedSkills.forEach(skill => {
            skill.elements.forEach(element => element.destroy());
        });
        this.availableSkills.forEach(skill => {
            skill.elements.forEach(element => element.destroy());
        });
        
        super.destroy();
    }
}