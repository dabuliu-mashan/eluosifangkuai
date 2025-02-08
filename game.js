class Tetris {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.blockSize = 30;
        this.cols = 10;
        this.rows = 20;
        this.canvas.width = this.blockSize * this.cols;
        this.canvas.height = this.blockSize * this.rows;
        
        this.score = 0;
        this.level = 1;
        this.gameOver = false;
        this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
        
        this.shapes = [
            [[1, 1, 1, 1]], // I
            [[1, 1], [1, 1]], // O
            [[1, 1, 1], [0, 1, 0]], // T
            [[1, 1, 1], [1, 0, 0]], // L
            [[1, 1, 1], [0, 0, 1]], // J
            [[1, 1, 0], [0, 1, 1]], // S
            [[0, 1, 1], [1, 1, 0]]  // Z
        ];
        
        this.colors = ['#00f0f0', '#f0f000', '#a000f0', '#f0a000', '#0000f0', '#00f000', '#f00000'];
        this.currentShape = null;
        this.currentColor = null;
        this.currentX = 0;
        this.currentY = 0;
        
        this.dropInterval = 1000;
        this.dropCounter = 0;
        this.lastTime = 0;
        
        this.moveInterval = null; // 用于存储持续移动的定时器
        this.moveSpeed = 60; // 持续移动的间隔时间（从50ms增加到60ms）
        this.downSpeed = 35; // 向下移动的间隔时间（从30ms增加到35ms）
        
        // 更新音效系统，使用在线音效资源
        this.sounds = {
            move: new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'),
            rotate: new Audio('https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3'),
            drop: new Audio('https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3'),
            clear: new Audio('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3'),
            gameOver: new Audio('https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3')
        };

        // 预加载所有音效
        Object.values(this.sounds).forEach(sound => {
            sound.load();
            sound.volume = 0.3; // 设置音量为30%
        });
        
        // 音效开关状态
        this.soundEnabled = true;
        
        this.bindControls();
        this.loadLeaderboard();
        this.newShape();
        this.update();
    }
    
    bindControls() {
        // 禁用所有按钮的默认长按行为
        document.querySelectorAll('.round-btn').forEach(btn => {
            btn.addEventListener('touchstart', (e) => e.preventDefault());
            btn.addEventListener('contextmenu', (e) => e.preventDefault());
            btn.style.webkitTouchCallout = 'none';
            btn.style.webkitUserSelect = 'none';
            btn.style.userSelect = 'none';
        });

        // 左按钮的触摸事件
        const leftBtn = document.getElementById('leftBtn');
        leftBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startMoving('left');
        });
        leftBtn.addEventListener('touchend', () => this.stopMoving());
        leftBtn.addEventListener('touchcancel', () => this.stopMoving());
        
        // 右按钮的触摸事件
        const rightBtn = document.getElementById('rightBtn');
        rightBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startMoving('right');
        });
        rightBtn.addEventListener('touchend', () => this.stopMoving());
        rightBtn.addEventListener('touchcancel', () => this.stopMoving());
        
        // 下按钮的触摸事件
        const dropBtn = document.getElementById('dropBtn');
        dropBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startMoving('down');
        });
        dropBtn.addEventListener('touchend', () => this.stopMoving());
        dropBtn.addEventListener('touchcancel', () => this.stopMoving());
        
        // 旋转按钮的触摸事件
        const rotateBtn = document.getElementById('rotateBtn');
        rotateBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.rotate();
        });
        
        // 鼠标事件（用于电脑端）
        leftBtn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.startMoving('left');
        });
        rightBtn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.startMoving('right');
        });
        dropBtn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.startMoving('down');
        });
        rotateBtn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.rotate();
        });
        document.addEventListener('mouseup', () => this.stopMoving());
        
        // 其他按钮的事件
        document.getElementById('restartBtn').addEventListener('click', () => this.restart());
        document.getElementById('saveScoreBtn').addEventListener('click', () => this.saveScore());
        document.getElementById('rankBtn').addEventListener('click', () => this.showLeaderboard());
        document.getElementById('closeRankBtn').addEventListener('click', () => this.hideLeaderboard());
        
        // 键盘控制
        document.addEventListener('keydown', (e) => {
            if (this.gameOver) return;
            
            // 如果已经在移动，不要重复开始
            if (this.moveInterval && (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowDown')) {
                return;
            }
            
            switch(e.key) {
                case 'ArrowLeft':
                    this.startMoving('left');
                    break;
                case 'ArrowRight':
                    this.startMoving('right');
                    break;
                case 'ArrowUp':
                    this.rotate();
                    break;
                case 'ArrowDown':
                    this.startMoving('down');
                    break;
            }
        });
        
        // 键盘松开停止移动
        document.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                this.stopMoving();
            }
        });
        
        // 更新音效开关按钮样式和功能
        const soundBtn = document.createElement('button');
        soundBtn.id = 'soundBtn';
        soundBtn.className = 'sound-btn';
        soundBtn.innerHTML = '🔊';
        soundBtn.style.position = 'absolute';
        soundBtn.style.top = '10px';
        soundBtn.style.right = '10px'; // 改为右上角
        soundBtn.style.padding = '8px';
        soundBtn.style.fontSize = '24px';
        soundBtn.style.backgroundColor = 'rgba(76, 175, 80, 0.8)';
        soundBtn.style.color = 'white';
        soundBtn.style.border = 'none';
        soundBtn.style.borderRadius = '50%';
        soundBtn.style.cursor = 'pointer';
        soundBtn.style.width = '40px';
        soundBtn.style.height = '40px';
        soundBtn.style.display = 'flex';
        soundBtn.style.justifyContent = 'center';
        soundBtn.style.alignItems = 'center';
        soundBtn.style.zIndex = '100';
        soundBtn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        
        document.querySelector('.game-container').appendChild(soundBtn);
        
        soundBtn.addEventListener('click', () => {
            this.soundEnabled = !this.soundEnabled;
            soundBtn.innerHTML = this.soundEnabled ? '🔊' : '🔇';
            // 播放测试音效
            if (this.soundEnabled) {
                this.playSound('move');
            }
        });
    }
    
    startMoving(direction) {
        if (this.gameOver) return;
        
        // 先立即移动一次
        if (direction === 'left') {
            this.moveLeft();
        } else if (direction === 'right') {
            this.moveRight();
        } else if (direction === 'down') {
            this.moveDown();
        }
        
        // 清除可能存在的之前的定时器
        this.stopMoving();
        
        // 设置持续移动
        const speed = direction === 'down' ? this.downSpeed : this.moveSpeed;
        this.moveInterval = setInterval(() => {
            if (direction === 'left') {
                this.moveLeft();
            } else if (direction === 'right') {
                this.moveRight();
            } else if (direction === 'down') {
                this.moveDown();
            }
        }, speed);
    }
    
    stopMoving() {
        if (this.moveInterval) {
            clearInterval(this.moveInterval);
            this.moveInterval = null;
        }
    }
    
    showLeaderboard() {
        document.querySelector('.leaderboard-modal').classList.remove('hidden');
        this.updateLeaderboardModal();
    }
    
    hideLeaderboard() {
        document.querySelector('.leaderboard-modal').classList.add('hidden');
    }
    
    updateLeaderboardModal() {
        const leaderboard = JSON.parse(localStorage.getItem('tetrisLeaderboard') || '[]');
        const leaderboardList = document.getElementById('leaderboardListModal');
        leaderboardList.innerHTML = '';
        
        leaderboard.sort((a, b) => b.score - a.score)
            .slice(0, 10)
            .forEach((entry, index) => {
                const div = document.createElement('div');
                div.textContent = `${index + 1}. ${entry.name}: ${entry.score}分`;
                leaderboardList.appendChild(div);
            });
    }
    
    updateScore(lines) {
        const points = [40, 100, 300, 1200]; // 消行基础分数
        this.score += points[lines - 1] * this.level;
        document.getElementById('score').textContent = this.score;
        
        // 自动升级
        if (this.score > this.level * 1000) {
            this.level++;
            document.getElementById('level').textContent = this.level;
            this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 50);
        }
    }
    
    newShape() {
        const randomIndex = Math.floor(Math.random() * this.shapes.length);
        this.currentShape = this.shapes[randomIndex];
        this.currentColor = this.colors[randomIndex];
        this.currentX = Math.floor((this.cols - this.currentShape[0].length) / 2);
        this.currentY = 0;
        
        if (this.collision()) {
            this.gameOver = true;
            this.playSound('gameOver');
            document.querySelector('.game-over').classList.remove('hidden');
            document.getElementById('finalScore').textContent = this.score;
        }
    }
    
    collision() {
        for (let y = 0; y < this.currentShape.length; y++) {
            for (let x = 0; x < this.currentShape[y].length; x++) {
                if (this.currentShape[y][x]) {
                    const newX = this.currentX + x;
                    const newY = this.currentY + y;
                    
                    if (newX < 0 || newX >= this.cols || newY >= this.rows) return true;
                    if (newY >= 0 && this.board[newY][newX]) return true;
                }
            }
        }
        return false;
    }
    
    merge() {
        for (let y = 0; y < this.currentShape.length; y++) {
            for (let x = 0; x < this.currentShape[y].length; x++) {
                if (this.currentShape[y][x]) {
                    this.board[this.currentY + y][this.currentX + x] = this.currentColor;
                }
            }
        }
    }
    
    moveLeft() {
        this.currentX--;
        if (this.collision()) {
            this.currentX++;
        } else {
            this.playSound('move');
        }
    }
    
    moveRight() {
        this.currentX++;
        if (this.collision()) {
            this.currentX--;
        } else {
            this.playSound('move');
        }
    }
    
    moveDown() {
        this.currentY++;
        if (this.collision()) {
            this.currentY--;
            this.merge();
            this.playSound('drop');
            this.clearLines();
            this.newShape();
        }
    }
    
    rotate() {
        const rotated = this.currentShape[0].map((_, i) =>
            this.currentShape.map(row => row[i]).reverse()
        );
        const previousShape = this.currentShape;
        this.currentShape = rotated;
        
        if (this.collision()) {
            this.currentShape = previousShape;
        } else {
            this.playSound('rotate');
        }
    }
    
    clearLines() {
        let linesCleared = 0;
        
        for (let y = this.rows - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell)) {
                this.board.splice(y, 1);
                this.board.unshift(Array(this.cols).fill(0));
                linesCleared++;
                y++;
            }
        }
        
        if (linesCleared > 0) {
            this.playSound('clear');
            this.updateScore(linesCleared);
        }
    }
    
    draw() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制已固定的方块
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.board[y][x]) {
                    this.drawBlock(x, y, this.board[y][x]);
                }
            }
        }
        
        // 绘制当前方块
        if (this.currentShape) {
            for (let y = 0; y < this.currentShape.length; y++) {
                for (let x = 0; x < this.currentShape[y].length; x++) {
                    if (this.currentShape[y][x]) {
                        this.drawBlock(this.currentX + x, this.currentY + y, this.currentColor);
                    }
                }
            }
        }
    }
    
    drawBlock(x, y, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x * this.blockSize, y * this.blockSize, this.blockSize - 1, this.blockSize - 1);
    }
    
    update(time = 0) {
        const deltaTime = time - this.lastTime;
        this.lastTime = time;
        
        if (!this.gameOver) {
            this.dropCounter += deltaTime;
            if (this.dropCounter > this.dropInterval) {
                this.moveDown();
                this.dropCounter = 0;
            }
            
            this.draw();
            requestAnimationFrame(this.update.bind(this));
        }
    }
    
    loadLeaderboard() {
        const leaderboard = JSON.parse(localStorage.getItem('tetrisLeaderboard') || '[]');
        this.updateLeaderboardDisplay(leaderboard);
    }
    
    updateLeaderboardDisplay(leaderboard) {
        const leaderboardList = document.getElementById('leaderboardList');
        leaderboardList.innerHTML = '';
        
        leaderboard.sort((a, b) => b.score - a.score)
            .slice(0, 10)
            .forEach((entry, index) => {
                const div = document.createElement('div');
                div.textContent = `${index + 1}. ${entry.name}: ${entry.score}分`;
                leaderboardList.appendChild(div);
            });
    }
    
    saveScore() {
        const playerName = document.getElementById('playerName').value.trim();
        if (!playerName) {
            alert('请输入你的名字！');
            return;
        }

        const leaderboard = JSON.parse(localStorage.getItem('tetrisLeaderboard') || '[]');
        leaderboard.push({
            name: playerName,
            score: this.score,
            date: new Date().toISOString()
        });

        // 按分数排序并只保留前50名
        leaderboard.sort((a, b) => b.score - a.score)
            .slice(0, 50);

        localStorage.setItem('tetrisLeaderboard', JSON.stringify(leaderboard));
        this.updateLeaderboardDisplay(leaderboard);
        document.getElementById('saveScoreBtn').disabled = true;
    }
    
    restart() {
        this.stopMoving();
        this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
        this.score = 0;
        this.level = 1;
        this.gameOver = false;
        this.dropInterval = 1000;
        document.getElementById('score').textContent = '0';
        document.getElementById('level').textContent = '1';
        document.getElementById('saveScoreBtn').disabled = false;
        document.getElementById('playerName').value = '';
        document.querySelector('.game-over').classList.add('hidden');
        this.newShape();
        this.update();
    }
    
    // 修改播放音效的方法，添加错误处理和音量控制
    playSound(soundName) {
        if (this.soundEnabled && this.sounds[soundName]) {
            try {
                const sound = this.sounds[soundName];
                sound.currentTime = 0;
                sound.volume = 0.3; // 确保每次播放时音量都是30%
                
                const playPromise = sound.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.log('音效播放失败:', error);
                    });
                }
            } catch (error) {
                console.log('音效系统错误:', error);
            }
        }
    }

    // 添加音量控制方法
    setVolume(volume) {
        const newVolume = Math.max(0, Math.min(1, volume)); // 确保音量在0-1之间
        Object.values(this.sounds).forEach(sound => {
            sound.volume = newVolume;
        });
    }
}

// 启动游戏
window.addEventListener('load', () => {
    new Tetris();
}); 