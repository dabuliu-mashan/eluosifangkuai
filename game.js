class Tetris {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.blockSize = 30;
        this.cols = 10;
        this.rows = 20;
        this.canvas.width = this.blockSize * this.cols;
        this.canvas.height = this.blockSize * this.rows;
        
        // 创建预览画布
        this.previewCanvas = document.createElement('canvas');
        this.previewCanvas.id = 'previewCanvas';
        this.previewBlockSize = 25; // 预览区块大小改为25px
        this.previewCanvas.width = this.previewBlockSize * 4;
        this.previewCanvas.height = this.previewBlockSize * 4;
        this.previewCtx = this.previewCanvas.getContext('2d');
        
        // 将预览画布添加到预览容器
        document.getElementById('previewContainer').appendChild(this.previewCanvas);
        
        this.score = 0;
        this.maxScore = 999999;  // 设置最大分数为999,999
        this.level = 1;
        this.maxLevel = 99;      // 设置最大等级为99
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
        
        // 添加下一个方块的属性
        this.nextShape = null;
        this.nextColor = null;
        
        // 调整移动速度（降低15%）
        this.moveSpeed = 70; // 从60ms增加到70ms
        this.downSpeed = 40; // 从35ms增加到40ms
        
        // 自动下落速度系统
        this.baseDropInterval = 1000; // 基础下落间隔
        this.minDropInterval = 100;   // 最小下落间隔
        this.dropInterval = this.baseDropInterval;
        this.dropCounter = 0;
        this.lastTime = 0;
        
        this.moveInterval = null;
        
        // 优化音效系统
        this.audioContext = null;
        this.soundEnabled = true;
        this.soundBuffers = {};
        
        // 优化音频初始化
        this.initAudio();
        
        this.sounds = {
            move: new Audio('data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAEAAABVgANTU1NTU1Q0NDQ0NDUFBQUFBQXl5eXl5ea2tra2tra3l5eXl5eYaGhoaGhpSUlJSUlKGhoaGhoaGvr6+vr6+8vLy8vLzKysrKysrX19fX19fX5eXl5eXl8vLy8vLy////////AAAAAExhdmM1OC4xMwAAAAAAAAAAAAAAACQCgAAAAAAAAAVY82AhbwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+MYxAALACwAAP/AADwQKVE9YWDGPkQWpT66yk4+zIiYPoTUaT3tnU+NFxkYmC4T/f+g4NDFY8T1/GNYxb/ZYs5jF8Y5j/+MYxA8L0DU0A/+AACZNG5/2Z+zzXzRD/51h6P4hGAGKDGQGJpJbZ6w8rx/H8X1TRP5p5PvX/Pc//f1TdwlACApwgDf/+MYxBoK4DVpQP8iAtYYjKhhiGhkHoYHQkxkQwxMxhiGhkHoYHQuxAAAAA0ATuc4EQwBoAL4AFwABQABEQAAA0AE/+MYxB4LGDVMAP8iAtYIAP/Q+yL/I+BRMCSD/P8VwBUAFMAOgAz//5cBYAL4AFwABQABEQAAA0AE8AEUAEIABgAB/+MYxCoLCDVEAP8iAtYIAP/Q+yL/I+BRMCSD/P8VwBUAFMAOgAz//5cBYAL4AFwABQABEQAAA0AE8AEUAEIABgAB/+MYxCoLCDVEAP8iAtYIAP/Q+yL/I+BRMCSD/P8VwBUAFMAOgAz//5cBYAL4AFwABQABEQAAA0AE8AEUAEIABgAB/+MYxCoLCDVEAP8iAtYIAP/Q+yL/I+BRMCSD/P8VwBUAFMAOgAz//5cBYAL4AFwABQABEQAAA0AE8AEUAEIABgAB'),
            rotate: new Audio('data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAEAAABVgANTU1NTU1Q0NDQ0NDUFBQUFBQXl5eXl5ea2tra2tra3l5eXl5eYaGhoaGhpSUlJSUlKGhoaGhoaGvr6+vr6+8vLy8vLzKysrKysrX19fX19fX5eXl5eXl8vLy8vLy////////AAAAAExhdmM1OC4xMwAAAAAAAAAAAAAAACQCgAAAAAAAAAVY82AhbwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+MYxAALACwAAP/AADwQKVE9YWDGPkQWpT66yk4+zIiYPoTUaT3tnU+NFxkYmC4T/f+g4NDFY8T1/GNYxb/ZYs5jF8Y5j/+MYxA8L0DU0A/+AACZNG5/2Z+zzXzRD/51h6P4hGAGKDGQGJpJbZ6w8rx/H8X1TRP5p5PvX/Pc//f1TdwlACApwgDf/+MYxBoK4DVpQP8iAtYYjKhhiGhkHoYHQkxkQwxMxhiGhkHoYHQuxAAAAA0ATuc4EQwBoAL4AFwABQABEQAAA0AE/+MYxB4LGDVMAP8iAtYIAP/Q+yL/I+BRMCSD/P8VwBUAFMAOgAz//5cBYAL4AFwABQABEQAAA0AE8AEUAEIABgAB/+MYxCoLCDVEAP8iAtYIAP/Q+yL/I+BRMCSD/P8VwBUAFMAOgAz//5cBYAL4AFwABQABEQAAA0AE8AEUAEIABgAB'),
            drop: new Audio('data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAEAAABVgANTU1NTU1Q0NDQ0NDUFBQUFBQXl5eXl5ea2tra2tra3l5eXl5eYaGhoaGhpSUlJSUlKGhoaGhoaGvr6+vr6+8vLy8vLzKysrKysrX19fX19fX5eXl5eXl8vLy8vLy////////AAAAAExhdmM1OC4xMwAAAAAAAAAAAAAAACQCgAAAAAAAAAVY82AhbwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+MYxAALACwAAP/AADwQKVE9YWDGPkQWpT66yk4+zIiYPoTUaT3tnU+NFxkYmC4T/f+g4NDFY8T1/GNYxb/ZYs5jF8Y5j/+MYxA8L0DU0A/+AACZNG5/2Z+zzXzRD/51h6P4hGAGKDGQGJpJbZ6w8rx/H8X1TRP5p5PvX/Pc//f1TdwlACApwgDf/+MYxBoK4DVpQP8iAtYYjKhhiGhkHoYHQkxkQwxMxhiGhkHoYHQuxAAAAA0ATuc4EQwBoAL4AFwABQABEQAAA0AE/+MYxB4LGDVMAP8iAtYIAP/Q+yL/I+BRMCSD/P8VwBUAFMAOgAz//5cBYAL4AFwABQABEQAAA0AE8AEUAEIABgAB/+MYxCoLCDVEAP8iAtYIAP/Q+yL/I+BRMCSD/P8VwBUAFMAOgAz//5cBYAL4AFwABQABEQAAA0AE8AEUAEIABgAB'),
            clear: new Audio('data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAEAAABVgANTU1NTU1Q0NDQ0NDUFBQUFBQXl5eXl5ea2tra2tra3l5eXl5eYaGhoaGhpSUlJSUlKGhoaGhoaGvr6+vr6+8vLy8vLzKysrKysrX19fX19fX5eXl5eXl8vLy8vLy////////AAAAAExhdmM1OC4xMwAAAAAAAAAAAAAAACQCgAAAAAAAAAVY82AhbwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+MYxAALACwAAP/AADwQKVE9YWDGPkQWpT66yk4+zIiYPoTUaT3tnU+NFxkYmC4T/f+g4NDFY8T1/GNYxb/ZYs5jF8Y5j/+MYxA8L0DU0A/+AACZNG5/2Z+zzXzRD/51h6P4hGAGKDGQGJpJbZ6w8rx/H8X1TRP5p5PvX/Pc//f1TdwlACApwgDf/+MYxBoK4DVpQP8iAtYYjKhhiGhkHoYHQkxkQwxMxhiGhkHoYHQuxAAAAA0ATuc4EQwBoAL4AFwABQABEQAAA0AE/+MYxB4LGDVMAP8iAtYIAP/Q+yL/I+BRMCSD/P8VwBUAFMAOgAz//5cBYAL4AFwABQABEQAAA0AE8AEUAEIABgAB/+MYxCoLCDVEAP8iAtYIAP/Q+yL/I+BRMCSD/P8VwBUAFMAOgAz//5cBYAL4AFwABQABEQAAA0AE8AEUAEIABgAB'),
            gameOver: new Audio('data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAEAAABVgANTU1NTU1Q0NDQ0NDUFBQUFBQXl5eXl5ea2tra2tra3l5eXl5eYaGhoaGhpSUlJSUlKGhoaGhoaGvr6+vr6+8vLy8vLzKysrKysrX19fX19fX5eXl5eXl8vLy8vLy////////AAAAAExhdmM1OC4xMwAAAAAAAAAAAAAAACQCgAAAAAAAAAVY82AhbwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+MYxAALACwAAP/AADwQKVE9YWDGPkQWpT66yk4+zIiYPoTUaT3tnU+NFxkYmC4T/f+g4NDFY8T1/GNYxb/ZYs5jF8Y5j/+MYxA8L0DU0A/+AACZNG5/2Z+zzXzRD/51h6P4hGAGKDGQGJpJbZ6w8rx/H8X1TRP5p5PvX/Pc//f1TdwlACApwgDf/+MYxBoK4DVpQP8iAtYYjKhhiGhkHoYHQkxkQwxMxhiGhkHoYHQuxAAAAA0ATuc4EQwBoAL4AFwABQABEQAAA0AE/+MYxB4LGDVMAP8iAtYIAP/Q+yL/I+BRMCSD/P8VwBUAFMAOgAz//5cBYAL4AFwABQABEQAAA0AE8AEUAEIABgAB/+MYxCoLCDVEAP8iAtYIAP/Q+yL/I+BRMCSD/P8VwBUAFMAOgAz//5cBYAL4AFwABQABEQAAA0AE8AEUAEIABgAB')
        };

        // 添加音效开关按钮
        const soundBtn = document.createElement('button');
        soundBtn.id = 'soundBtn';
        soundBtn.className = 'round-btn';
        soundBtn.innerHTML = '🔊';
        soundBtn.style.backgroundColor = '#2196F3';
        document.querySelector('.controls').appendChild(soundBtn);
        
        // 绑定音效开关事件
        soundBtn.addEventListener('click', () => {
            this.soundEnabled = !this.soundEnabled;
            soundBtn.innerHTML = this.soundEnabled ? '🔊' : '🔇';
            
            if (this.soundEnabled && this.audioContext?.state === 'suspended') {
                this.audioContext.resume();
            }
        });

        // 添加消除行数统计
        this.linesCleared = 0;
        
        this.bindControls();
        this.loadLeaderboard();
        this.generateNextShape(); // 生成第一个预览方块
        this.newShape();         // 生成当前方块
        this.update();
    }
    
    initAudio() {
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            
            // 添加全局触摸事件监听器来初始化音频
            const initAudioContext = () => {
                if (this.audioContext.state === 'suspended') {
                    this.audioContext.resume();
                }
                // 预加载所有音效
                Object.values(this.sounds).forEach(sound => {
                    sound.load();
                });
            };
            
            // 监听多种用户交互事件来初始化音频
            ['touchstart', 'touchend', 'click', 'keydown'].forEach(event => {
                document.addEventListener(event, initAudioContext, { once: true });
            });
            
            // 监听页面可见性变化
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.audioContext?.suspend();
                } else if (this.soundEnabled) {
                    this.audioContext?.resume();
                }
            });
            
        } catch (e) {
            console.log('Web Audio API不支持:', e);
        }
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
        const points = [40, 100, 300, 1200]; // 基础消行分数
        const newScore = Math.min(
            this.maxScore,
            this.score + points[lines - 1] * this.level
        );
        this.score = newScore;
        document.getElementById('score').textContent = this.score.toLocaleString();
        
        // 更新等级和下落速度
        if (this.score > this.level * 1000 && this.level < this.maxLevel) {
            this.level = Math.min(this.maxLevel, this.level + 1);
            document.getElementById('level').textContent = this.level;
            
            // 计算新的下落速度，使用对数函数使速度增长逐渐放缓
            const speedFactor = Math.log10(this.level + 9); // +9确保从1级开始就有合理的加速
            this.dropInterval = Math.max(
                this.minDropInterval,
                this.baseDropInterval - (speedFactor * 100)
            );
        }
    }
    
    generateNextShape() {
        const randomIndex = Math.floor(Math.random() * this.shapes.length);
        this.nextShape = this.shapes[randomIndex];
        this.nextColor = this.colors[randomIndex];
        this.drawPreview();
    }
    
    drawPreview() {
        this.previewCtx.fillStyle = '#000';
        this.previewCtx.fillRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
        
        if (this.nextShape) {
            const offsetX = (4 - this.nextShape[0].length) * this.previewBlockSize / 2;
            const offsetY = (4 - this.nextShape.length) * this.previewBlockSize / 2;
            
            for (let y = 0; y < this.nextShape.length; y++) {
                for (let x = 0; x < this.nextShape[y].length; x++) {
                    if (this.nextShape[y][x]) {
                        this.previewCtx.fillStyle = this.nextColor;
                        this.previewCtx.fillRect(
                            offsetX + x * this.previewBlockSize,
                            offsetY + y * this.previewBlockSize,
                            this.previewBlockSize - 1,
                            this.previewBlockSize - 1
                        );
                    }
                }
            }
        }
    }
    
    newShape() {
        if (this.nextShape === null) {
            this.generateNextShape();
        }
        
        this.currentShape = this.nextShape;
        this.currentColor = this.nextColor;
        this.currentX = Math.floor((this.cols - this.currentShape[0].length) / 2);
        this.currentY = 0;
        
        // 生成下一个预览方块
        this.generateNextShape();
        
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
            this.linesCleared += linesCleared; // 更新总消除行数
            document.getElementById('lines').textContent = this.linesCleared;
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
        const blockSize = this.blockSize;
        const borderRadius = 4;  // 圆角大小
        
        // 绘制主体方块（带圆角）
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(x * blockSize + borderRadius, y * blockSize);
        this.ctx.lineTo(x * blockSize + blockSize - borderRadius - 1, y * blockSize);
        this.ctx.quadraticCurveTo(x * blockSize + blockSize - 1, y * blockSize, x * blockSize + blockSize - 1, y * blockSize + borderRadius);
        this.ctx.lineTo(x * blockSize + blockSize - 1, y * blockSize + blockSize - borderRadius - 1);
        this.ctx.quadraticCurveTo(x * blockSize + blockSize - 1, y * blockSize + blockSize - 1, x * blockSize + blockSize - borderRadius - 1, y * blockSize + blockSize - 1);
        this.ctx.lineTo(x * blockSize + borderRadius, y * blockSize + blockSize - 1);
        this.ctx.quadraticCurveTo(x * blockSize, y * blockSize + blockSize - 1, x * blockSize, y * blockSize + blockSize - borderRadius - 1);
        this.ctx.lineTo(x * blockSize, y * blockSize + borderRadius);
        this.ctx.quadraticCurveTo(x * blockSize, y * blockSize, x * blockSize + borderRadius, y * blockSize);
        this.ctx.fill();
        
        // 添加高光效果
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.beginPath();
        this.ctx.moveTo(x * blockSize + borderRadius, y * blockSize);
        this.ctx.lineTo(x * blockSize + blockSize - borderRadius - 1, y * blockSize);
        this.ctx.quadraticCurveTo(x * blockSize + blockSize - 1, y * blockSize, x * blockSize + blockSize - 1, y * blockSize + borderRadius);
        this.ctx.lineTo(x * blockSize + blockSize - 1, y * blockSize + blockSize * 0.3);
        this.ctx.lineTo(x * blockSize, y * blockSize + blockSize * 0.3);
        this.ctx.lineTo(x * blockSize, y * blockSize + borderRadius);
        this.ctx.quadraticCurveTo(x * blockSize, y * blockSize, x * blockSize + borderRadius, y * blockSize);
        this.ctx.fill();
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
            level: this.level,
            lines: this.linesCleared,
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
        this.linesCleared = 0; // 重置消除行数
        this.gameOver = false;
        this.dropInterval = this.baseDropInterval;
        document.getElementById('score').textContent = '0';
        document.getElementById('level').textContent = '1';
        document.getElementById('lines').textContent = '0'; // 更新消除行数显示
        document.getElementById('saveScoreBtn').disabled = false;
        document.getElementById('playerName').value = '';
        document.querySelector('.game-over').classList.add('hidden');
        this.generateNextShape();
        this.newShape();
        this.update();
    }
    
    // 修改播放音效的方法
    playSound(soundName) {
        if (!this.soundEnabled || !this.sounds[soundName]) return;
        
        try {
            const sound = this.sounds[soundName];
            
            // 确保音频已加载
            if (sound.readyState < 2) {
                sound.load();
            }
            
            // 重置音频位置并播放
            sound.currentTime = 0;
            
            const playPromise = sound.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    if (error.name === 'NotAllowedError') {
                        // 如果是权限问题，尝试恢复音频上下文
                        this.audioContext?.resume().then(() => {
                            sound.play().catch(e => console.log('音频播放失败:', e));
                        });
                    }
                });
            }
        } catch (error) {
            console.log('音效播放失败:', error);
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