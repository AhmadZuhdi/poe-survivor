// Wave management logic for BattleScene

export function handleWaveLogic(scene) {
    if (scene.waveEnemies <= 0 && scene.enemies.countActive(true) === 0) {
        scene.wave++;
        scene.waveText.setText('Wave: ' + scene.wave);
        scene.waveBossSpawned = false;
        scene.waveEnemies = 5 + Math.floor(scene.wave * 2.5);
        scene.enemyInterval = Math.max(1000 - (scene.wave * 40), 200);
    }
}

export function handleBossSpawn(scene) {
    const isBossWave = scene.wave % 10 === 0;
    if (isBossWave && !scene.waveBossSpawned && scene.enemies.countActive(true) === 0) {
        scene.waveBossSpawned = true;
        const w = scene.scale.width;
        const h = scene.scale.height;
        let x, y;
        const edge = Phaser.Math.Between(0, 3);
        if (edge === 0) { x = Phaser.Math.Between(0, w); y = 0; }
        else if (edge === 1) { x = w; y = Phaser.Math.Between(0, h); }
        else if (edge === 2) { x = Phaser.Math.Between(0, w); y = h; }
        else { x = 0; y = Phaser.Math.Between(0, h); }
        const boss = scene.enemies.get(x, y, 'enemy');
        if (boss) {
            boss.setActive(true).setVisible(true);
            boss.setData('health', 300 + scene.wave * 20);
            boss.setScale(2);
            boss.setTint(0xff00ff);
            boss.setData('isBoss', true);
        }
    }
}
