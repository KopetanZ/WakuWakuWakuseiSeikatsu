class PlanetColonyGame {
    constructor() {
        this.gameState = {
            daysLeft: 1095, // 3年間
            resources: {
                energy: 100,
                food: 50,
                minerals: 20,
                personnel: 5,
                morale: 80
            },
            progress: 0,
            facilities: [],
            day: 1,
            gameRunning: false
        };
        
        this.facilityTypes = [
            { name: '太陽光発電所', cost: { minerals: 30, personnel: 5 }, benefit: '⚡エネルギー+20/日' },
            { name: '食料生産施設', cost: { minerals: 25, personnel: 4 }, benefit: '🍖食料+15/日' },
            { name: '採掘プラント', cost: { minerals: 40, personnel: 6 }, benefit: '⛏️鉱物+10/日' },
            { name: '居住区', cost: { minerals: 20, personnel: 3 }, benefit: '😊士気+10, 👥人員+2' },
            { name: '研究所', cost: { minerals: 50, personnel: 8 }, benefit: '🔬技術進歩+25%' }
        ];
        
        this.events = [
            { 
                name: '宇宙船の残骸発見',
                probability: 0.15,
                effect: () => {
                    this.gameState.resources.minerals += Math.floor(Math.random() * 30) + 10;
                    this.gameState.resources.energy += Math.floor(Math.random() * 20) + 5;
                    return '宇宙船の残骸を発見！鉱物と電力を獲得した。';
                }
            },
            {
                name: '謎の生命体との遭遇',
                probability: 0.1,
                effect: () => {
                    if (Math.random() > 0.5) {
                        this.gameState.resources.food += Math.floor(Math.random() * 25) + 15;
                        return '友好的な生命体が食料を分けてくれた！';
                    } else {
                        this.gameState.resources.morale -= Math.floor(Math.random() * 20) + 5;
                        return '生命体に驚いて士気が下がった...';
                    }
                }
            },
            {
                name: '地球からの緊急通信',
                probability: 0.08,
                effect: () => {
                    this.gameState.daysLeft -= Math.floor(Math.random() * 100) + 50;
                    return '地球情勢悪化により補給予定が前倒しになった！';
                }
            }
        ];
        
        this.timer = null;
    }

    startGame() {
        document.getElementById('storyIntro').style.display = 'none';
        document.getElementById('gameMain').style.display = 'block';
        this.gameState.gameRunning = true;
        this.updateDisplay();
        this.startTimer();
        this.addLog('惑星開拓を開始。頑張って生き残ろう...');
    }

    startTimer() {
        this.timer = setInterval(() => {
            if (this.gameState.gameRunning) {
                this.gameState.day++;
                this.gameState.daysLeft--;
                this.dailyUpdate();
                this.updateDisplay();
                this.checkGameEnd();
            }
        }, 2000); // 2秒で1日経過
    }

    dailyUpdate() {
        // 施設からの収益
        this.gameState.facilities.forEach(facility => {
            if (facility.name === '太陽光発電所') {
                this.gameState.resources.energy += 20;
            } else if (facility.name === '食料生産施設') {
                this.gameState.resources.food += 15;
            } else if (facility.name === '採掘プラント') {
                this.gameState.resources.minerals += 10;
            } else if (facility.name === '居住区') {
                this.gameState.resources.morale = Math.min(100, this.gameState.resources.morale + 2);
            }
        });

        // 維持コスト
        this.gameState.resources.food -= Math.max(1, Math.floor(this.gameState.resources.personnel / 2));
        this.gameState.resources.energy -= Math.max(1, Math.floor(this.gameState.resources.personnel / 3));
        
        // 士気の自然減少
        if (this.gameState.resources.food < 20 || this.gameState.resources.energy < 30) {
            this.gameState.resources.morale -= 2;
        }

        // ランダムイベント
        this.events.forEach(event => {
            if (Math.random() < event.probability) {
                const message = event.effect();
                this.addLog(message);
            }
        });

        // リソースの下限制限
        Object.keys(this.gameState.resources).forEach(resource => {
            if (resource !== 'morale') {
                this.gameState.resources[resource] = Math.max(0, this.gameState.resources[resource]);
            } else {
                this.gameState.resources[resource] = Math.max(0, Math.min(100, this.gameState.resources[resource]));
            }
        });
    }

    exploreArea() {
        if (!this.canAfford({ energy: 15 })) {
            this.addLog('エネルギーが不足している...');
            return;
        }

        this.gameState.resources.energy -= 15;
        
        const discoveries = [
            { type: 'minerals', amount: Math.floor(Math.random() * 20) + 5, message: '鉱物の鉱脈を発見！' },
            { type: 'food', amount: Math.floor(Math.random() * 15) + 5, message: '食用植物を発見！' },
            { type: 'personnel', amount: 1, message: '遭難者を救助！仲間が増えた。' },
            { type: 'energy', amount: Math.floor(Math.random() * 25) + 10, message: 'エネルギー結晶を発見！' }
        ];

        const discovery = discoveries[Math.floor(Math.random() * discoveries.length)];
        this.gameState.resources[discovery.type] += discovery.amount;
        this.gameState.progress += 2;
        
        this.addLog(`探索成功: ${discovery.message}`);
        this.updateDisplay();
    }

    recruitPeople() {
        if (!this.canAfford({ energy: 20 })) {
            this.addLog('人員募集にはエネルギーが必要だ...');
            return;
        }

        this.gameState.resources.energy -= 20;
        const recruited = Math.floor(Math.random() * 3) + 1;
        this.gameState.resources.personnel += recruited;
        this.gameState.progress += 3;
        
        this.addLog(`${recruited}人の新しい開拓者が到着！`);
        this.updateDisplay();
    }

    mineResources() {
        if (!this.canAfford({ personnel: 2, energy: 10 })) {
            this.addLog('採掘には人員とエネルギーが必要だ...');
            return;
        }

        this.gameState.resources.personnel -= 2;
        this.gameState.resources.energy -= 10;
        
        const minedMinerals = Math.floor(Math.random() * 25) + 15;
        this.gameState.resources.minerals += minedMinerals;
        this.gameState.progress += 4;
        
        this.addLog(`採掘成功！鉱物${minedMinerals}を獲得。`);
        this.updateDisplay();
    }

    buildFacility() {
        if (!this.canAfford({ minerals: 30, personnel: 5 })) {
            this.addLog('施設建設には鉱物と人員が必要だ...');
            return;
        }

        const facility = this.facilityTypes[Math.floor(Math.random() * this.facilityTypes.length)];
        
        this.gameState.resources.minerals -= facility.cost.minerals;
        this.gameState.resources.personnel -= facility.cost.personnel;
        this.gameState.facilities.push(facility);
        this.gameState.progress += 15;
        
        this.addLog(`${facility.name}を建設！効果: ${facility.benefit}`);
        this.updateFacilitiesDisplay();
        this.updateDisplay();
    }

    boostMorale() {
        if (!this.canAfford({ food: 15 })) {
            this.addLog('士気向上には食料が必要だ...');
            return;
        }

        this.gameState.resources.food -= 15;
        this.gameState.resources.morale = Math.min(100, this.gameState.resources.morale + 20);
        this.gameState.progress += 2;
        
        this.addLog('みんなで食事会を開催！士気が向上した。');
        this.updateDisplay();
    }

    canAfford(cost) {
        return Object.keys(cost).every(resource => 
            this.gameState.resources[resource] >= cost[resource]
        );
    }

    checkGameEnd() {
        if (this.gameState.daysLeft <= 0) {
            this.endGame();
        } else if (this.gameState.progress >= 100) {
            this.winGame();
        } else if (this.gameState.resources.personnel <= 0 || this.gameState.resources.morale <= 0) {
            this.failGame();
        }
    }

    winGame() {
        this.gameState.gameRunning = false;
        clearInterval(this.timer);
        
        document.getElementById('gameMain').style.display = 'none';
        document.getElementById('gameOver').style.display = 'block';
        document.getElementById('gameOverTitle').textContent = '🎉 開拓成功！';
        document.getElementById('gameOverMessage').innerHTML = `
            <p>おめでとう！あなたはケプラー442bの開拓に成功した！</p>
            <p>コロニー完成度: ${this.gameState.progress}%</p>
            <p>建設した施設: ${this.gameState.facilities.length}個</p>
            <p><strong>次は銀河開拓帝国の建設だ！（続編に期待）</strong></p>
        `;
    }

    failGame() {
        this.gameState.gameRunning = false;
        clearInterval(this.timer);
        
        document.getElementById('gameMain').style.display = 'none';
        document.getElementById('gameOver').style.display = 'block';
        document.getElementById('gameOverTitle').textContent = '💀 開拓失敗...';
        
        let reason = '';
        if (this.gameState.resources.personnel <= 0) {
            reason = '人員不足でコロニーが維持できなくなった...';
        } else if (this.gameState.resources.morale <= 0) {
            reason = '士気が崩壊し、住民が反乱を起こした...';
        }
        
        document.getElementById('gameOverMessage').innerHTML = `
            <p>${reason}</p>
            <p>開拓進捗: ${this.gameState.progress}%</p>
            <p>最終日: ${1095 - this.gameState.daysLeft}日目</p>
            <p>地球への帰還チケット代を稼ぐため、宇宙港で皿洗いをする羽目になった...</p>
        `;
    }

    endGame() {
        this.gameState.gameRunning = false;
        clearInterval(this.timer);
        
        document.getElementById('gameMain').style.display = 'none';
        document.getElementById('gameOver').style.display = 'block';
        
        if (this.gameState.progress >= 70) {
            document.getElementById('gameOverTitle').textContent = '🎊 部分的成功';
            document.getElementById('gameOverMessage').innerHTML = `
                <p>時間切れになったが、ある程度の開拓は達成できた。</p>
                <p>最終進捗: ${this.gameState.progress}%</p>
                <p>地球本部から「まあまあ頑張った」と評価された。</p>
                <p>次の惑星での開拓権利を獲得！</p>
            `;
        } else {
            document.getElementById('gameOverTitle').textContent = '⏰ 時間切れ';
            document.getElementById('gameOverMessage').innerHTML = `
                <p>補給船の到着まで間に合わなかった...</p>
                <p>最終進捗: ${this.gameState.progress}%</p>
                <p>「もう少し頑張れたのでは？」と地球本部からお叱りを受けた。</p>
            `;
        }
    }

    updateDisplay() {
        document.getElementById('countdown').textContent = this.gameState.daysLeft;
        document.getElementById('energy').textContent = this.gameState.resources.energy;
        document.getElementById('food').textContent = this.gameState.resources.food;
        document.getElementById('minerals').textContent = this.gameState.resources.minerals;
        document.getElementById('personnel').textContent = this.gameState.resources.personnel;
        document.getElementById('morale').textContent = this.gameState.resources.morale;
        document.getElementById('progress').textContent = Math.min(100, this.gameState.progress);
        document.getElementById('progressFill').style.width = `${Math.min(100, this.gameState.progress)}%`;
    }

    updateFacilitiesDisplay() {
        const facilitiesDiv = document.getElementById('facilities');
        if (this.gameState.facilities.length === 0) {
            facilitiesDiv.innerHTML = '<p>建設済み施設: なし</p>';
        } else {
            const facilityList = this.gameState.facilities.map(f => f.name).join(', ');
            facilitiesDiv.innerHTML = `<p>建設済み施設: ${facilityList}</p>`;
        }
    }

    addLog(message) {
        const log = document.getElementById('gameLog');
        const p = document.createElement('p');
        p.textContent = `Day ${this.gameState.day}: ${message}`;
        log.appendChild(p);
        log.scrollTop = log.scrollHeight;
        
        // ログが多すぎる場合は古いものを削除
        if (log.children.length > 10) {
            log.removeChild(log.firstChild);
        }
    }

    restartGame() {
        this.gameState = {
            daysLeft: 1095,
            resources: {
                energy: 100,
                food: 50,
                minerals: 20,
                personnel: 5,
                morale: 80
            },
            progress: 0,
            facilities: [],
            day: 1,
            gameRunning: false
        };
        
        document.getElementById('gameOver').style.display = 'none';
        document.getElementById('storyIntro').style.display = 'block';
        document.getElementById('gameLog').innerHTML = '<p>惑星ケプラー442bに到着。予想以上に荒涼としている...</p>';
        this.updateFacilitiesDisplay();
        
        if (this.timer) {
            clearInterval(this.timer);
        }
    }
}

// ゲームインスタンスを作成
const game = new PlanetColonyGame();

// グローバル関数として公開
function startGame() {
    game.startGame();
}

function exploreArea() {
    game.exploreArea();
}

function recruitPeople() {
    game.recruitPeople();
}

function mineResources() {
    game.mineResources();
}

function buildFacility() {
    game.buildFacility();
}

function boostMorale() {
    game.boostMorale();
}

function restartGame() {
    game.restartGame();
}