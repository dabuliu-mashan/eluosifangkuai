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
        this.moveSpeed = 50; // 持续移动的间隔时间（毫秒）
        
        this.bindControls();
        this.loadLeaderboard();
        this.newShape();
        this.update();
    }
    
    bindControls() {
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
        
        // 鼠标事件（用于电脑端）
        leftBtn.addEventListener('mousedown', () => this.startMoving('left'));
        rightBtn.addEventListener('mousedown', () => this.startMoving('right'));
        document.addEventListener('mouseup', () => this.stopMoving());
        
        // 其他按钮保持单击事件
        document.getElementById('rotateBtn').addEventListener('click', () => this.rotate());
        document.getElementById('dropBtn').addEventListener('click', () => this.moveDown());
        document.getElementById('restartBtn').addEventListener('click', () => this.restart());
        document.getElementById('saveScoreBtn').addEventListener('click', () => this.saveScore());
        document.getElementById('rankBtn').addEventListener('click', () => this.showLeaderboard());
        document.getElementById('closeRankBtn').addEventListener('click', () => this.hideLeaderboard());
        
        // 键盘控制
        document.addEventListener('keydown', (e) => {
            if (this.gameOver) return;
            
            // 如果已经在移动，不要重复开始
            if (this.moveInterval) return;
            
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
                    this.moveDown();
                    break;
            }
        });
        
        // 键盘松开停止移动
        document.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                this.stopMoving();
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
        }
        
        // 清除可能存在的之前的定时器
        this.stopMoving();
        
        // 设置持续移动
        this.moveInterval = setInterval(() => {
            if (direction === 'left') {
                this.moveLeft();
            } else if (direction === 'right') {
                this.moveRight();
            }
        }, this.moveSpeed);
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
}

// 启动游戏
window.addEventListener('load', () => {
    new Tetris();
}); 