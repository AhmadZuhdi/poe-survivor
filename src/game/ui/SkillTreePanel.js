import Phaser from 'phaser';

export class SkillTreePanel extends Phaser.GameObjects.Container {
    constructor(scene) {
        // Selected stats text
        super(scene, 0, 0);
        this.selectedStatsText = scene.add.text(scene.scale.width - 320, 24, '', {
            fontFamily: 'Arial', fontSize: 18, color: '#44ff44', backgroundColor: '#222', padding: { left: 8, right: 8, top: 4, bottom: 4 }
        }).setDepth(999).setVisible(false);
        scene.add.existing(this.selectedStatsText);
        const width = scene.scale.width;
        const height = scene.scale.height;
        this.setDepth(201);
        this.width = width;
        this.height = height;
        this.scene = scene;
        this.visible = false;
        scene.add.existing(this);
        // Skill points system
        this.totalSkillPoints = 0; // Total earned
        this.usedSkillPoints = 0;  // Used for unlocked nodes
        this.skillPointsText = scene.add.text(32, 32, '', {
            fontFamily: 'Arial', fontSize: 22, color: '#ffff00', stroke: '#000', strokeThickness: 3
        }).setDepth(999).setVisible(false);
        scene.add.existing(this.skillPointsText);
    // Arrow key movement
    this.cursors = scene.input.keyboard.createCursorKeys();

        // Tooltip for skill info
        this.tooltip = scene.add.text(0, 0, '', {
            fontFamily: 'Arial', fontSize: 20, color: '#ffff88', backgroundColor: '#222', padding: { left: 8, right: 8, top: 4, bottom: 4 }
        }).setDepth(999).setVisible(false);
        scene.add.existing(this.tooltip);

    // Background overlay
    this.bg = scene.add.graphics();
    this.bg.fillStyle(0x333355, 0.98);
    this.bg.fillRect(0, 0, width, height);
    this.bg.setScrollFactor?.(0);
    this.add(this.bg);

        // Pan/zoom state
        this.panX = 0;
        this.panY = 0;
        this.zoom = 1;
        this.isDragging = false;
        this.dragStart = {x: 0, y: 0};

    // Drag logic (scene-wide for reliability)
    this.setInteractive(new Phaser.Geom.Rectangle(0, 0, scene.scale.width, scene.scale.height), Phaser.Geom.Rectangle.Contains);
        this.on('pointerdown', (pointer) => {
            this.isDragging = true;
            this.dragStart.x = pointer.x;
            this.dragStart.y = pointer.y;
            this.dragOriginX = this.panX;
            this.dragOriginY = this.panY;
        });
        // Use scene-wide pointerup and pointermove for robust drag
        scene.input.on('pointerup', () => { this.isDragging = false; });
        scene.input.on('pointermove', (pointer) => {
            if (this.isDragging) {
                this.panX = this.dragOriginX + (pointer.x - this.dragStart.x);
                this.panY = this.dragOriginY + (pointer.y - this.dragStart.y);
                this.redrawSkillTree();
            }
        });
        // Reset drag if pointer leaves window
        window.addEventListener('mouseleave', () => { this.isDragging = false; });

        // Zoom logic (mouse wheel)
        scene.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
            const oldZoom = this.zoom;
            if (deltaY < 0) {
                this.zoom = Math.min(this.zoom * 1.1, 3);
            } else if (deltaY > 0) {
                this.zoom = Math.max(this.zoom * 0.9, 0.2);
            }
            // Adjust pan so zoom centers on pointer
            const mx = pointer.x;
            const my = pointer.y;
            this.panX = mx - (mx - this.panX) * (this.zoom / oldZoom);
            this.panY = my - (my - this.panY) * (this.zoom / oldZoom);
            this.redrawSkillTree();
        });

        // Skill nodes container
    this.nodes = [];
    this.tree = null;
        // Skill tree will be loaded when panel is opened
    this.selectedNodes = [];
    this.nodeStates = {}; // nodeId: true (enabled) or false (disabled)
    this.selectedStats = [];
    }

    async loadSkillTree() {
    // Load skill tree JSON
    const response = await fetch('SkillTree.json');
    const data = await response.json();
    this.tree = data;
    this.renderSkillTree(this.tree);
    }

    getConnectedNodes() {
        const nodesData = tree.nodes || {};
        const connected = new Set();
        this.selectedNodes.forEach(nodeId => {
            nodesData[nodeId].out?.forEach(targetId => connected.add(targetId));
            nodesData[nodeId].in?.forEach(sourceId => connected.add(sourceId));
        });
        return connected;
    }
        
    renderSkillTree(tree) {
        // Debug: print connection map for each node
        if (window && window.console) {
            const nodesData = tree.nodes || {};
            Object.entries(nodesData).forEach(([nodeId, nodeInfo]) => {
                // console.log(`Node ${nodeId}: in=[${(nodeInfo.in||[]).join(',')}], out=[${(nodeInfo.out||[]).join(',')}]`);
            });
        }
        // Remove old nodes and lines
        for (const node of this.nodes) node.destroy();
        // Update selected stats display
        if (this.visible && this.selectedStats && this.selectedStats.length > 0) {
            const groupedStat = this.calculateStats()
            const prettyStat = Object.keys(groupedStat).reduce((acc, stat) => {
                return `${acc}${stat}: (${groupedStat[stat]})\n`;
            }, '');
            this.selectedStatsText.setText('Selected Stats:\n' + prettyStat);
            this.selectedStatsText.setVisible(true);
        } else {
            this.selectedStatsText.setVisible(false);
        }
        if (this.connectionLines) {
            this.connectionLines.destroy();
        }
        this.nodes = [];
        this.connectionLines = null;
    // Create a single graphics object for all lines
    const linesGfx = this.scene.add.graphics();
    linesGfx.setDepth(200);
        // Render skill nodes from groups with x/y positions (new structure)
        const groups = tree.groups || {};
        const nodesData = tree.nodes || {};
        const minX = tree.min_x || 0;
        const minY = tree.min_y || 0;
        const maxX = tree.max_x || 0;
        const maxY = tree.max_y || 0;
        // Calculate scaling to fit all nodes in panel
        const panelW = this.width;
        const panelH = this.height;
        const treeW = maxX - minX;
        const treeH = maxY - minY;
        const margin = 80;
        const scaleX = (panelW - margin * 2) / (treeW || 1);
        const scaleY = (panelH - margin * 2) / (treeH || 1);
        const baseScale = Math.min(scaleX, scaleY);
        // Center offset
        const offsetX = margin - minX * baseScale + (panelW - (treeW * baseScale)) / 2;
        const offsetY = margin - minY * baseScale + (panelH - (treeH * baseScale)) / 2;
        // Apply pan/zoom
        const scale = baseScale * this.zoom;
        const panX = this.panX;
        const panY = this.panY;

        // Store node positions for connection drawing
        const nodePositions = {};

        // First pass: render nodes and record positions
        for (const [, groupData] of Object.entries(groups)) {
            if (typeof groupData.x === 'number' && typeof groupData.y === 'number' && Array.isArray(groupData.nodes)) {
                const gx = offsetX + groupData.x * scale + panX;
                const gy = offsetY + groupData.y * scale + panY;
                for (const nodeId of groupData.nodes) {
                    const nodeInfo = nodesData[nodeId] || {};
                    // Show keystone, notable, and mastery nodes
                    // Determine color based on granted attributes
                    let color = 0xaaaaaa;
                    let r = 0, g = 0, b = 0;
                    if (nodeInfo.grantedStrength) r = 255;
                    if (nodeInfo.grantedDexterity) g = 255;
                    if (nodeInfo.grantedIntelligence) b = 255;
                    if (r + g + b > 0) {
                        color = (r << 16) | (g << 8) | b;
                    }
                    let radius = 4 * this.zoom;
                    const circle = this.scene.add.graphics();
                    circle.fillStyle(color, 1);
                    circle.fillCircle(gx, gy, radius);
                    // Draw border if selected
                    if (this.nodeStates[nodeId]) {
                        circle.lineStyle(3, 0xffee44, 1);
                        circle.strokeCircle(gx, gy, radius + 2);
                    }
                    circle.setInteractive(new Phaser.Geom.Circle(gx, gy, radius), Phaser.Geom.Circle.Contains);
                    circle.on('pointerover', (pointer) => {
                        let info = 'No info';
                        if (nodeInfo.stats && nodeInfo.stats.length > 0) {
                            info = nodeInfo.stats.join('\n');
                        }
                        if (nodeInfo.name) info = `${nodeInfo.name} (${nodeId}) \n\n${info}`;
                        this.tooltip.setText(info);
                        this.tooltip.setPosition(pointer.x + 16, pointer.y + 8);
                        this.tooltip.setVisible(true);
                    });
                    circle.on('pointerout', () => {
                        this.tooltip.setVisible(false);
                    });
                    circle.on('pointerdown', () => {
                        this.handleNodeClick(nodeId, nodeInfo);
                    });
                    this.add(circle);
                    this.nodes.push(circle);
                    nodePositions[nodeId] = { x: gx, y: gy };
                }
            }
        }

        // Second pass: draw connections
        linesGfx.lineStyle(2, 0x8888ff, 0.7);
        for (const nodeId in nodesData) {
            const nodeInfo = nodesData[nodeId];
            if (!nodePositions[nodeId] || !nodeInfo.out) continue;
            for (const targetId of nodeInfo.out) {
                if (!nodePositions[targetId]) continue;
                linesGfx.beginPath();
                linesGfx.moveTo(nodePositions[nodeId].x, nodePositions[nodeId].y);
                linesGfx.lineTo(nodePositions[targetId].x, nodePositions[targetId].y);
                linesGfx.strokePath();
            }
        }
        this.add(linesGfx);
        this.connectionLines = linesGfx;
    }

    redrawSkillTree() {
        if (this.tree) {
            this.renderSkillTree(this.tree);
        }
    }

    async open() {
        if (this.nodes.length === 0) {
            await this.loadSkillTree();
        }
        this.visible = true;
        this.active = true;
        this.selectedStatsText.setVisible(true);
        this.skillPointsText.setVisible(true);
    this.skillPointsText.setText(`Skill Points: ${this.totalSkillPoints - this.usedSkillPoints} / ${this.totalSkillPoints}`);
        // Pause the game
        if (this.scene?.time) {
            this.scene.time.timeScale = 0;
        }
    }

    close() {
        this.visible = false;
        this.active = false;
        this.selectedStatsText.setVisible(false);
        this.skillPointsText.setVisible(false);
        // Resume the game
        if (this.scene?.time) {
            this.scene.time.timeScale = 1;
        }
    }
    updateSkillPoints(points) {
        this.totalSkillPoints = points;
        // Recalculate usedSkillPoints from selectedNodes
        this.usedSkillPoints = Array.isArray(this.selectedNodes) ? this.selectedNodes.length : 0;
        if (this.visible) {
            this.skillPointsText.setText(`Skill Points: ${this.totalSkillPoints - this.usedSkillPoints} / ${this.totalSkillPoints}`);
        }
    }
    update() {
        if (!this.visible || !this.active) return;
        const moveAmount = 10;
        if (this.cursors.left.isDown) {
            this.x += moveAmount;
        }
        if (this.cursors.right.isDown) {
            this.x -= moveAmount;
        }
        if (this.cursors.up.isDown) {
            this.y += moveAmount;
        }
        if (this.cursors.down.isDown) {
            this.y -= moveAmount;
        }
    }

    handleNodeClick(nodeId, nodeInfo) {
        // Skill point check
        if (!this.nodeStates[nodeId]) {
            if ((this.totalSkillPoints - this.usedSkillPoints) <= 0) {
                // Feedback: flash skillPointsText
                this.scene.tweens.add({
                    targets: this.skillPointsText,
                    alpha: 0.2,
                    yoyo: true,
                    duration: 100,
                    repeat: 2,
                    onComplete: () => this.skillPointsText.setAlpha(1)
                });
                return;
            }
        }
        // If no nodes selected, allow any node
        if (this.selectedNodes.length === 0) {
            this.nodeStates[nodeId] = true;
            this.selectedNodes.push(nodeId);
            this.usedSkillPoints++;
            this.skillPointsText.setText(`Skill Points: ${this.totalSkillPoints - this.usedSkillPoints} / ${this.totalSkillPoints}`);
            this.updateSelectedStats();
            this.redrawSkillTree();
            return;
        }
        // Only allow selection if node is directly connected to a selected node
        // Connection is valid if:
        // - The nodeId is in the 'out' array of any selected node
        // - OR the nodeId's 'in' array contains any selected node
        // TODO: enable later: allow selection if there's a path through already selected nodes
        const connected = this.selectedNodes.some(selectedId => {
            const selectedInfo = this.tree.nodes[selectedId];
            // Outgoing connection from selected node to this node
            if (Array.isArray(selectedInfo.out) && selectedInfo.out.includes(nodeId)) return true;
            // Incoming connection from this node to selected node
            if (Array.isArray(nodeInfo.in) && nodeInfo.in.includes(selectedId)) return true;
            return false;
        });

        if (!this.nodeStates[nodeId]) {
            this.nodeStates[nodeId] = true;
            this.selectedNodes.push(nodeId);
            this.usedSkillPoints++;
            this.skillPointsText.setText(`Skill Points: ${this.totalSkillPoints - this.usedSkillPoints} / ${this.totalSkillPoints}`);
            this.updateSelectedStats();
            this.redrawSkillTree();
        }
    }

    updateSelectedStats() {
        // Gather stats from all selected nodes
        this.selectedStats = [];
        for (const nodeId of this.selectedNodes) {
            const nodeInfo = this.tree.nodes[nodeId];
            if (nodeInfo && nodeInfo.stats) {
                this.selectedStats.push(...nodeInfo.stats);
            }
        }
    }

    async toggle() {
        if (this.visible) {
            this.close();
        } else {
            await this.open();
        }
    }

    calculateStats() {
        if (!this.selectedStats || this.selectedStats.length === 0) return {};

        return this.selectedStats.reduce((acc, stat) => {
            
            acc[stat] = (acc[stat] || 0) + 1;

            return acc;
        }, {});
    }
}
