import Phaser from 'phaser';

export class InventoryPanel {
    constructor(scene, onToggle) {
        this.scene = scene;
        this.visible = false;
        this.panelWidth = scene.scale.width;
        this.panelHeight = scene.scale.height;
        this.panelX = 0;
        this.panelY = 0;
        this.onToggle = onToggle;
        this.equipmentSlots = [
            { key: 'weapon', label: 'Weapon' },
            { key: 'offWeapon', label: 'Off Weapon' },
            { key: 'helm', label: 'Helm' },
            { key: 'armor', label: 'Armor' },
            { key: 'glove', label: 'Glove' },
            { key: 'bottom', label: 'Bottom' },
            { key: 'shoe', label: 'Shoe' }
        ];
        this.createPanel();
    }

    createPanel() {
        // Drag preview text object
        this.dragPreview = this.scene.add.text(0, 0, '', {
            fontFamily: 'Arial', fontSize: 20, color: '#ffff88', backgroundColor: '#222', padding: { left: 8, right: 8, top: 4, bottom: 4 }
        }).setDepth(1000).setVisible(false);
        this.dragData = null;
        // Tooltip text object
        this.tooltip = this.scene.add.text(0, 0, '', {
            fontFamily: 'Arial', fontSize: 20, color: '#ffff88', backgroundColor: '#222', padding: { left: 8, right: 8, top: 4, bottom: 4 }, wordWrap: { width: 320 }
        }).setDepth(999).setVisible(false);
        // Panel background (fullscreen)
        this.bg = this.scene.add.rectangle(
            this.panelWidth / 2,
            this.panelHeight / 2,
            this.panelWidth,
            this.panelHeight,
            0x333333,
            0.98
        ).setDepth(200).setStrokeStyle(4, 0xffffff).setVisible(false);

        // Title text (centered)
        this.title = this.scene.add.text(
            this.panelWidth / 2,
            48,
            'Inventory',
            { fontFamily: 'Arial', fontSize: 48, color: '#ffff88', stroke: '#000', strokeThickness: 4 }
        ).setOrigin(0.5, 0).setDepth(201).setVisible(false);

        this.setupEquipmentSlots();
        this.setupInventorySlots();
    }
    setupEquipmentSlots() {
        this.slotGraphics = [];
        this.slotLabels = [];
        this.slotItems = [];
        const leftSectionX = this.panelWidth * 0.18;
        const leftSectionY = 140;
        const slotW = 250;
        const slotH = 80;
        const gapY = 32;
        for (let i = 0; i < this.equipmentSlots.length; i++) {
            const x = leftSectionX;
            const y = leftSectionY + i * (slotH + gapY);
            // Slot box
            const slot = this.scene.add.rectangle(x, y, slotW, slotH, 0x222244, 0.95)
                .setStrokeStyle(3, 0xffffff)
                .setDepth(202)
                .setVisible(false)
                .setInteractive({ useHandCursor: true, draggable: true });
            slot.isEquipmentSlot = true;
            slot.eqIdx = i;
            // Drag listeners for equipment slots
            slot.on('dragstart', (pointer) => {
                if (!this.lastItems) return;
                const slotKey = this.equipmentSlots[i].key;
                const item = this.lastItems[slotKey];
                if (item) {
                    this.dragData = { from: 'equipment', index: i, item };
                    this.dragPreview.setText(item.name || item);
                    this.dragPreview.setPosition(pointer.x, pointer.y);
                    this.dragPreview.setVisible(true);
                }
            });
            slot.on('drag', (pointer) => {
                if (this.dragPreview.visible) {
                    this.dragPreview.setPosition(pointer.x, pointer.y);
                }
            });
            slot.on('dragend', (pointer, droppedOn) => {
                this.dragPreview.setVisible(false);
                if (!this.dragData) return;
                // If dropped on inventory grid slot
                if (droppedOn && droppedOn.isInventoryGrid) {
                    const gridIdx = droppedOn.gridIdx;
                    const gridItems = Array.isArray(this.lastItems.grid) ? this.lastItems.grid.slice() : [];
                    if (!gridItems[gridIdx]) {
                        gridItems[gridIdx] = this.dragData.item;
                        this.lastItems[this.equipmentSlots[this.dragData.index].key] = null;
                        this.lastItems.grid = gridItems;
                        this.updateItems(this.lastItems);
                    }
                }
                this.dragData = null;
            });
            // Hover listeners for equipment slots
            slot.on('pointerover', () => {
                slot.setFillStyle(0x444488, 0.98);
                slot.setStrokeStyle(4, 0xffff88);
                // Tooltip logic
                const item = this.lastItems && this.lastItems[this.equipmentSlots[i].key];
                if (item && typeof item.generateTooltip === 'function') {
                    const tip = item.generateTooltip();
                    this.tooltip.setText(tip);
                    this.tooltip.setPosition(x + slotW / 2 + 12, y - slotH / 2);
                    this.tooltip.setVisible(true);
                }
            });
            slot.on('pointerout', () => {
                slot.setFillStyle(0x222244, 0.95);
                slot.setStrokeStyle(3, 0xffffff);
                this.tooltip.setVisible(false);
            });
            // Click to unequip
            slot.on('pointerdown', () => {
                if (!this.lastItems) return;
                const slotKey = this.equipmentSlots[i].key;
                const item = this.lastItems[slotKey];
                if (item) {
                    // Find first empty grid slot
                    const gridItems = Array.isArray(this.lastItems.grid) ? this.lastItems.grid.slice() : [];
                    const emptyIdx = gridItems.findIndex(g => !g);
                    if (emptyIdx !== -1) {
                        gridItems[emptyIdx] = item;
                        this.lastItems[slotKey] = null;
                        this.lastItems.grid = gridItems;
                        this.updateItems(this.lastItems);
                    }
                }
            });
            this.slotGraphics.push(slot);
            // Label (left aligned)
            const label = this.scene.add.text(x - slotW / 2 + 10, y - slotH / 2 + 8, this.equipmentSlots[i].label, {
                fontFamily: 'Arial', fontSize: 22, color: '#ffff88', stroke: '#000', strokeThickness: 2
            }).setOrigin(0, 0).setDepth(203).setVisible(false);
            this.slotLabels.push(label);
            // Item placeholder (right aligned)
            const itemText = this.scene.add.text(x + slotW / 2 - 10, y, 'Empty', {
                fontFamily: 'Arial', fontSize: 20, color: '#ffffff', align: 'right'
            }).setOrigin(1, 0.5).setDepth(204).setVisible(false);
            this.slotItems.push(itemText);
        }
    }

    setupInventorySlots() {
        this.gridCols = 4;
        this.gridRows = 10;
        this.gridSlotW = 50;
        this.gridSlotH = 50;
        this.inventoryGridSlots = [];
        this.inventoryGridLabels = [];
        const rightSectionX = this.panelWidth * 0.55;
        const rightSectionY = 140;
        for (let row = 0; row < this.gridRows; row++) {
            for (let col = 0; col < this.gridCols; col++) {
                const idx = row * this.gridCols + col;
                const x = rightSectionX + col * (this.gridSlotW + 16);
                const y = rightSectionY + row * (this.gridSlotH + 12);
                // Grid slot box
                const gridSlot = this.scene.add.rectangle(x, y, this.gridSlotW, this.gridSlotH, 0x444444, 0.95)
                    .setStrokeStyle(2, 0xffffff)
                    .setDepth(205)
                    .setVisible(false)
                    .setInteractive({ useHandCursor: true, draggable: true, dropZone: true });
                gridSlot.isInventoryGrid = true;
                gridSlot.gridIdx = idx;
                // Drag listeners for inventory grid slots
                gridSlot.on('dragstart', (pointer) => {
                    if (!this.lastItems) return;
                    const gridItems = Array.isArray(this.lastItems.grid) ? this.lastItems.grid : [];
                    const item = gridItems[idx];
                    if (item) {
                        this.dragData = { from: 'inventory', index: idx, item };
                        this.dragPreview.setText(item.name || item);
                        this.dragPreview.setPosition(pointer.x, pointer.y);
                        this.dragPreview.setVisible(true);
                    }
                });
                gridSlot.on('drag', (pointer) => {
                    if (this.dragPreview.visible) {
                        this.dragPreview.setPosition(pointer.x, pointer.y);
                    }
                });
                gridSlot.on('dragend', (pointer, droppedOn) => {
                    this.dragPreview.setVisible(false);
                    if (!this.dragData) return;
                    // If dropped on equipment slot
                    if (droppedOn && droppedOn.isEquipmentSlot) {
                        const eqIdx = droppedOn.eqIdx;
                        const eqKey = this.equipmentSlots[eqIdx].key;
                        // Only equip if slot is empty and type matches
                        if (!this.lastItems[eqKey] && this.dragData.item.type === eqKey) {
                            this.lastItems[eqKey] = this.dragData.item;
                            const gridItems = Array.isArray(this.lastItems.grid) ? this.lastItems.grid.slice() : [];
                            gridItems[this.dragData.index] = null;
                            this.lastItems.grid = gridItems;
                            this.updateItems(this.lastItems);
                        }
                    }
                    this.dragData = null;
                });
                // Hover listeners for inventory grid slots
                gridSlot.on('pointerover', () => {
                    gridSlot.setFillStyle(0x8888aa, 0.98);
                    gridSlot.setStrokeStyle(3, 0xffff88);
                    // Tooltip logic
                    const gridItems = this.lastItems && Array.isArray(this.lastItems.grid) ? this.lastItems.grid : [];
                    const item = gridItems[idx];
                    if (item && typeof item.generateTooltip === 'function') {
                        const tip = item.generateTooltip();
                        this.tooltip.setText(tip);
                        this.tooltip.setPosition(x + this.gridSlotW / 2 + 12, y - this.gridSlotH / 2);
                        this.tooltip.setVisible(true);
                    }
                });
                gridSlot.on('pointerout', () => {
                    gridSlot.setFillStyle(0x444444, 0.95);
                    gridSlot.setStrokeStyle(2, 0xffffff);
                    this.tooltip.setVisible(false);
                });
                // Click to equip
                gridSlot.on('pointerdown', () => {
                    if (!this.lastItems) return;
                    const gridItems = Array.isArray(this.lastItems.grid) ? this.lastItems.grid.slice() : [];
                    const item = gridItems[idx];
                    if (item && item.type) {
                        // Find matching equipment slot
                        const eqIdx = this.equipmentSlots.findIndex(eq => eq.key === item.type && !this.lastItems[eq.key]);
                        if (eqIdx !== -1) {
                            this.lastItems[this.equipmentSlots[eqIdx].key] = item;
                            gridItems[idx] = null;
                            this.lastItems.grid = gridItems;
                            this.updateItems(this.lastItems);
                        }
                    }
                });
                this.inventoryGridSlots.push(gridSlot);
                // Grid slot label
                const gridLabel = this.scene.add.text(x, y, 'Empty', {
                    fontFamily: 'Arial', fontSize: 18, color: '#ffffff', align: 'center'
                }).setOrigin(0.5, 0.5).setDepth(206).setVisible(false);
                this.inventoryGridLabels.push(gridLabel);
            }
        }
    }

    setPosition(x, y) {
        // No-op for fullscreen panel
    }

    toggle() {
        this.visible = !this.visible;
        this.bg.setVisible(this.visible);
        this.title.setVisible(this.visible);
        // Show/hide equipment slots
        if (Array.isArray(this.slotGraphics)) {
            this.slotGraphics.forEach(slot => slot.setVisible(this.visible));
        }
        if (Array.isArray(this.slotLabels)) {
            this.slotLabels.forEach(label => label.setVisible(this.visible));
        }
        if (Array.isArray(this.slotItems)) {
            this.slotItems.forEach(item => item.setVisible(this.visible));
        }
        if (typeof this.onToggle === 'function') {
            this.onToggle(this.visible);
        }
        // Show/hide inventory grid
        if (Array.isArray(this.inventoryGridSlots)) {
            this.inventoryGridSlots.forEach(slot => slot.setVisible(this.visible));
        }
        if (Array.isArray(this.inventoryGridLabels)) {
            this.inventoryGridLabels.forEach(label => label.setVisible(this.visible));
        }
    }

    updateItems(items) {
    // Store last items for tooltip lookup
    this.lastItems = items;
        // Update slot items (assume items is an object with keys matching slot keys)
        if (!items || typeof items !== 'object') {
            this.slotItems.forEach(itemText => itemText.setText('Empty'));
            this.inventoryGridLabels.forEach(label => label.setText('Empty'));
            return;
        }
        for (let i = 0; i < this.equipmentSlots.length; i++) {
            const slotKey = this.equipmentSlots[i].key;
            const item = items[slotKey];
            if (item) {
                this.slotItems[i].setText(item.name || item);
            } else {
                this.slotItems[i].setText('Empty');
            }
        }

        // Update inventory grid
        const gridItems = Array.isArray(items.grid) ? items.grid : [];
        for (let i = 0; i < this.inventoryGridLabels.length; i++) {
            const item = gridItems[i];
            if (item) {
                this.inventoryGridLabels[i].setText(item.name || item);
            } else {
                this.inventoryGridLabels[i].setText('Empty');
            }
        }
    }
}
