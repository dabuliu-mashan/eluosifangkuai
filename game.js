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
        this.basePoints = 1; // 基础分数
        this.clearAllAvailable = true; // 清屏技能是否可用
        this.clearAllThreshold = 1000; // 清屏技能所需分数
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
        
        this.bindControls();
        this.loadLeaderboard();
        this.newShape();
        this.update();
    }
    
    bindControls() {
        document.getElementById('leftBtn').addEventListener('click', () => this.moveLeft());
        document.getElementById('rightBtn').addEventListener('click', () => this.moveRight());
        document.getElementById('rotateBtn').addEventListener('click', () => this.rotate());
        document.getElementById('dropBtn').addEventListener('click', () => this.moveDown());
        document.getElementById('restartBtn').addEventListener('click', () => this.restart());
        document.getElementById('levelUpBtn').addEventListener('click', () => this.levelUp());
        document.getElementById('clearAllBtn').addEventListener('click', () => this.clearAll());
        document.getElementById('saveScoreBtn').addEventListener('click', () => this.saveScore());
        
        // 键盘控制
        document.addEventListener('keydown', (e) => {
            if (this.gameOver) return;
            switch(e.key) {
                case 'ArrowLeft':
                    this.moveLeft();
                    break;
                case 'ArrowRight':
                    this.moveRight();
                    break;
                case 'ArrowUp':
                    this.rotate();
                    break;
                case 'ArrowDown':
                    this.moveDown();
                    break;
                case 'a':
                case 'A':
                    this.levelUp();
                    break;
                case 'b':
                case 'B':
                    this.clearAll();
                    break;
            }
        });
    }
    
    newShape() {
        const randomIndex = Math.floor(Math.random() * this.shapes.length);
        this.currentShape = this.shapes[randomIndex];
        this.currentColor = this.colors[randomIndex];
        this.currentX = Math.floor((this.cols - this.currentShape[0].length) / 2);
        this.currentY = 0;
        
        if (this.collision()) {
            this.gameOver = true;
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
        }
    }
    
    moveRight() {
        this.currentX++;
        if (this.collision()) {
            this.currentX--;
        }
    }
    
    moveDown() {
        this.currentY++;
        if (this.collision()) {
            this.currentY--;
            this.merge();
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
            this.updateScore(linesCleared);
        }
    }
    
    updateScore(lines) {
        const points = [40, 100, 300, 1200]; // 基础消行分数
        const earnedPoints = points[lines - 1] * this.basePoints;
        this.score += earnedPoints;
        document.getElementById('score').textContent = this.score;
        
        // 检查是否可以使用清屏技能
        if (this.score >= this.clearAllThreshold && this.clearAllAvailable) {
            document.getElementById('clearAllBtn').disabled = false;
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
    
    levelUp() {
        if (this.score >= this.level * 100) { // 升级所需分数
            this.level++;
            this.basePoints = this.level; // 基础分数随等级提升
            this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 50);
            document.getElementById('level').textContent = this.level;
        }
    }
    
    clearAll() {
        if (this.score >= this.clearAllThreshold && this.clearAllAvailable) {
            // 清除所有方块
            this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
            this.score += 500; // 使用清屏技能奖励分数
            document.getElementById('score').textContent = this.score;
            this.clearAllAvailable = false;
            document.getElementById('clearAllBtn').disabled = true;
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
        this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
        this.score = 0;
        this.level = 1;
        this.basePoints = 1;
        this.clearAllAvailable = true;
        this.gameOver = false;
        this.dropInterval = 1000;
        document.getElementById('score').textContent = '0';
        document.getElementById('level').textContent = '1';
        document.getElementById('clearAllBtn').disabled = true;
        document.getElementById('saveScoreBtn').disabled = false;
        document.getElementById('playerName').value = '';
        document.querySelector('.game-over').classList.add('hidden');
        this.newShape();
        this.update();
    }
}

// 启动游戏
window.addEventListener('load', () => {
    new Tetris();
}); 