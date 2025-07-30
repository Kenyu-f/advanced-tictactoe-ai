        class TicTacToeGame {
            constructor() {
                this.boardSize = 5;
                this.board = [];
                this.currentPlayer = 'X';
                this.gameMode = 'ai-medium';
                this.scores = { X: 0, O: 0 };
                this.gameActive = true;
                this.activePowerup = null;
                this.isAITurn = false;
                this.powerups = {
                    X: { remove: 2, double: 1, block: 1 },
                    O: { remove: 2, double: 1, block: 1 }
                };
                this.blockedCells = new Map();
                
                this.initializeElements();
                this.setupEventListeners();
                this.initializeGame();
            }
            
            initializeElements() {
                this.boardElement = document.getElementById('gameBoard');

                this.currentTurnElement = document.getElementById('currentTurn');
                this.scoreXElement = document.getElementById('scoreX');
                this.scoreOElement = document.getElementById('scoreO');
                this.gameStatusElement = document.getElementById('gameStatus');
                this.modalElement = document.getElementById('gameModal');
                this.modalTitleElement = document.getElementById('modalTitle');
                this.modalMessageElement = document.getElementById('modalMessage');
            }
            
            setupEventListeners() {
                document.getElementById('newGame').addEventListener('click', () => {
                    this.initializeGame();
                });
                
                document.getElementById('resetScore').addEventListener('click', () => {
                    this.resetScores();
                });
                
                document.getElementById('modalNewGame').addEventListener('click', () => {
                    this.hideModal();
                    this.initializeGame();
                });
                
                document.getElementById('boardSize').addEventListener('change', (e) => {
                    this.boardSize = parseInt(e.target.value);
                    this.initializeGame();
                });
                
                document.getElementById('gameMode').addEventListener('change', (e) => {
                    this.gameMode = e.target.value;
                    this.initializeGame();
                });
                
                document.querySelectorAll('.powerup-item').forEach(item => {
                    item.addEventListener('click', (e) => {
                        this.selectPowerup(e.currentTarget.dataset.powerup);
                    });
                });
            }
            
            initializeGame() {
                this.board = [];
                for (let i = 0; i < this.boardSize; i++) {
                    this.board[i] = [];
                    for (let j = 0; j < this.boardSize; j++) {
                        this.board[i][j] = '';
                    }
                }
                
                this.currentPlayer = 'X';
                this.gameActive = true;
                this.activePowerup = null;
                this.isAITurn = false;
                this.blockedCells.clear();
                
                this.powerups = {
                    X: { remove: 2, double: 1, block: 1 },
                    O: { remove: 2, double: 1, block: 1 }
                };
                
                this.createBoard();
                this.updateDisplay();
                this.hideModal();
            }
            
            createBoard() {
                this.boardElement.innerHTML = '';
                this.boardElement.style.gridTemplateColumns = `repeat(${this.boardSize}, minmax(40px, 1fr))`;
                
                for (let i = 0; i < this.boardSize; i++) {
                    for (let j = 0; j < this.boardSize; j++) {
                        const cell = document.createElement('div');
                        cell.className = 'cell';
                        cell.dataset.row = i;
                        cell.dataset.col = j;
                        cell.addEventListener('click', () => {
                            this.handleCellClick(i, j);
                        });
                        this.boardElement.appendChild(cell);
                    }
                }
            }
            
            getCellElement(row, col) {
                return document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            }
            
            handleCellClick(row, col) {
                if (!this.gameActive || this.isAITurn) return;
                
                if (this.activePowerup === 'remove') {
                    this.usePowerupRemove(row, col);
                    return;
                } else if (this.activePowerup === 'block') {
                    this.usePowerupBlock(row, col);
                    return;
                }
                
                if (this.board[row][col] !== '' || this.blockedCells.has(`${row}-${col}`)) return;
                
                this.makeMove(row, col, this.currentPlayer);
            }
            
            makeMove(row, col, player) {
                this.board[row][col] = player;
                const cellElement = this.getCellElement(row, col);
                cellElement.textContent = player;
                cellElement.className = `cell ${player.toLowerCase()} placed occupied`;
                
                const scores = this.calculateScores();
                this.scores = scores;
                this.updateDisplay();
                
                if (this.checkGameEnd()) {
                    this.endGame();
                    return;
                }
                
                if (this.activePowerup !== 'double') {
                    this.switchTurn();
                } else {
                    this.activePowerup = null;
                    this.updatePowerupDisplay();
                    this.gameStatusElement.textContent = 'ダブルターン完了！';
                }
                
                if (this.gameActive && this.gameMode !== 'human' && this.currentPlayer === 'O') {
                    this.handleAITurn();
                }
            }
            
            switchTurn() {
                this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
                this.updateDisplay();
                
                for (let [key, turns] of this.blockedCells.entries()) {
                    if (turns <= 1) {
                        this.blockedCells.delete(key);
                        const [row, col] = key.split('-').map(Number);
                        const cellElement = this.getCellElement(row, col);
                        cellElement.style.background = '';
                        cellElement.style.border = '';
                    } else {
                        this.blockedCells.set(key, turns - 1);
                    }
                }
            }
            
            handleAITurn() {
                this.isAITurn = true;
                this.currentTurnElement.parentElement.classList.add('ai-thinking');
                
                setTimeout(() => {
                    const move = this.getAIMove();
                    if (move) {
                        this.makeMove(move.row, move.col, 'O');
                    }
                    this.isAITurn = false;
                    this.currentTurnElement.parentElement.classList.remove('ai-thinking');
                }, 400);
            }
            
            getAIMove() {
                const difficulty = this.gameMode.split('-')[1];
                
                switch (difficulty) {
                    case 'easy':
                        return this.getRandomMove();
                    case 'medium':
                        return this.getMediumMove();
                    case 'hard':
                        return this.getHardMove();
                    default:
                        return this.getRandomMove();
                }
            }
            
            getRandomMove() {
                const emptyCells = [];
                for (let i = 0; i < this.boardSize; i++) {
                    for (let j = 0; j < this.boardSize; j++) {
                        if (this.board[i][j] === '' && !this.blockedCells.has(`${i}-${j}`)) {
                            emptyCells.push({ row: i, col: j });
                        }
                    }
                }
                return emptyCells.length > 0 ? emptyCells[Math.floor(Math.random() * emptyCells.length)] : null;
            }
            
            getMediumMove() {
                const winningMove = this.findWinningMove('O');
                if (winningMove) return winningMove;
                
                const blockingMove = this.findWinningMove('X');
                if (blockingMove) return blockingMove;
                
                return this.getRandomMove();
            }
            
            getHardMove() {
                const bestMove = this.findBestMove();
                return bestMove || this.getMediumMove();
            }
            
            findWinningMove(player) {
                for (let i = 0; i < this.boardSize; i++) {
                    for (let j = 0; j < this.boardSize; j++) {
                        if (this.board[i][j] === '' && !this.blockedCells.has(`${i}-${j}`)) {
                            this.board[i][j] = player;
                            const scores = this.calculateScores();
                            this.board[i][j] = '';
                            
                            const currentScores = this.calculateScores();
                            if (scores[player] > currentScores[player]) {
                                return { row: i, col: j };
                            }
                        }
                    }
                }
                return null;
            }
            
            findBestMove() {
                let bestScore = -Infinity;
                let bestMove = null;
                
                for (let i = 0; i < this.boardSize; i++) {
                    for (let j = 0; j < this.boardSize; j++) {
                        if (this.board[i][j] === '' && !this.blockedCells.has(`${i}-${j}`)) {
                            this.board[i][j] = 'O';
                            const score = this.evaluatePosition();
                            this.board[i][j] = '';
                            
                            if (score > bestScore) {
                                bestScore = score;
                                bestMove = { row: i, col: j };
                            }
                        }
                    }
                }
                
                return bestMove;
            }
            
            evaluatePosition() {
                const scores = this.calculateScores();
                return scores['O'] - scores['X'];
            }
            
            selectPowerup(powerupType) {
                if (!this.gameActive || this.isAITurn) return;
                if (this.gameMode !== 'human' && this.currentPlayer === 'O') return;
                if (this.powerups[this.currentPlayer][powerupType] <= 0) return;
                
                document.querySelectorAll('.powerup-item').forEach(item => {
                    item.classList.remove('active');
                });
                
                if (powerupType === 'double') {
                    this.activePowerup = 'double';
                    this.powerups[this.currentPlayer][powerupType]--;
                    this.updatePowerupDisplay();
                    this.gameStatusElement.textContent = 'ダブルターン発動！次の手でもう一度手番を得ます。';
                } else {
                    this.activePowerup = powerupType;
                    document.getElementById(`powerup-${powerupType}`).classList.add('active');
                    const actionName = powerupType === 'remove' ? 'リムーブ' : 'ブロック';
                    this.gameStatusElement.textContent = `${actionName}モード：対象のセルをクリックしてください。`;
                }
            }
            
            usePowerupRemove(row, col) {
                if (this.board[row][col] === '' || this.board[row][col] === this.currentPlayer) {
                    this.gameStatusElement.textContent = '相手のマークのみ消去できます。';
                    return;
                }
                
                this.board[row][col] = '';
                const cellElement = this.getCellElement(row, col);
                cellElement.textContent = '';
                cellElement.className = 'cell';
                
                this.powerups[this.currentPlayer]['remove']--;
                this.activePowerup = null;
                document.querySelectorAll('.powerup-item').forEach(item => {
                    item.classList.remove('active');
                });
                this.updatePowerupDisplay();
                this.gameStatusElement.textContent = '相手のマークを消去しました！';
                
                const scores = this.calculateScores();
                this.scores = scores;
                this.updateDisplay();
            }
            
            usePowerupBlock(row, col) {
                if (this.board[row][col] !== '' || this.blockedCells.has(`${row}-${col}`)) {
                    this.gameStatusElement.textContent = '空いているセルのみブロックできます。';
                    return;
                }
                
                this.blockedCells.set(`${row}-${col}`, 3);
                const cellElement = this.getCellElement(row, col);
                cellElement.style.background = 'rgba(255,0,0,0.3)';
                cellElement.style.border = '2px solid rgba(255,0,0,0.6)';
                
                this.powerups[this.currentPlayer]['block']--;
                this.activePowerup = null;
                document.querySelectorAll('.powerup-item').forEach(item => {
                    item.classList.remove('active');
                });
                this.updatePowerupDisplay();
                this.gameStatusElement.textContent = 'セルを3ターンブロックしました！';
            }
            
            calculateScores() {
                const scores = { X: 0, O: 0 };
                
                for (let i = 0; i < this.boardSize; i++) {
                    for (let j = 0; j < this.boardSize; j++) {
                        if (this.board[i][j] !== '') {
                            const player = this.board[i][j];
                            
                            // 横方向チェック
                            let count = 1;
                            let k = j + 1;
                            while (k < this.boardSize && this.board[i][k] === player) {
                                count++;
                                k++;
                            }
                            k = j - 1;
                            while (k >= 0 && this.board[i][k] === player) {
                                count++;
                                k--;
                            }
                            if (count >= 3) {
                                scores[player] += count - 2;
                            }
                            
                            // 縦方向チェック
                            count = 1;
                            k = i + 1;
                            while (k < this.boardSize && this.board[k][j] === player) {
                                count++;
                                k++;
                            }
                            k = i - 1;
                            while (k >= 0 && this.board[k][j] === player) {
                                count++;
                                k--;
                            }
                            if (count >= 3) {
                                scores[player] += count - 2;
                            }
                            
                            // 斜め方向チェック（左上から右下）
                            count = 1;
                            let row = i + 1, col = j + 1;
                            while (row < this.boardSize && col < this.boardSize && this.board[row][col] === player) {
                                count++;
                                row++;
                                col++;
                            }
                            row = i - 1;
                            col = j - 1;
                            while (row >= 0 && col >= 0 && this.board[row][col] === player) {
                                count++;
                                row--;
                                col--;
                            }
                            if (count >= 3) {
                                scores[player] += count - 2;
                            }
                            
                            // 斜め方向チェック（右上から左下）
                            count = 1;
                            row = i + 1;
                            col = j - 1;
                            while (row < this.boardSize && col >= 0 && this.board[row][col] === player) {
                                count++;
                                row++;
                                col--;
                            }
                            row = i - 1;
                            col = j + 1;
                            while (row >= 0 && col < this.boardSize && this.board[row][col] === player) {
                                count++;
                                row--;
                                col++;
                            }
                            if (count >= 3) {
                                scores[player] += count - 2;
                            }
                        }
                    }
                }
                
                // 重複カウントを修正（各ラインは一度だけカウント）
                scores.X = Math.floor(scores.X / 2);
                scores.O = Math.floor(scores.O / 2);
                
                return scores;
            }
            
            checkGameEnd() {
                // ボードが満杯かチェック
                let emptyCells = 0;
                for (let i = 0; i < this.boardSize; i++) {
                    for (let j = 0; j < this.boardSize; j++) {
                        if (this.board[i][j] === '' && !this.blockedCells.has(`${i}-${j}`)) {
                            emptyCells++;
                        }
                    }
                }
                
                return emptyCells === 0;
            }
            
            endGame() {
                this.gameActive = false;
                
                let winner = '';
                if (this.scores.X > this.scores.O) {
                    winner = 'X';
                } else if (this.scores.O > this.scores.X) {
                    winner = 'O';
                } else {
                    winner = 'Draw';
                }
                
                this.showModal(winner);
            }
            
            showModal(winner) {
                let title = '';
                let message = '';
                
                if (winner === 'Draw') {
                    title = '引き分け！';
                    message = `最終スコア - X: ${this.scores.X}, O: ${this.scores.O}`;
                } else {
                    title = `プレイヤー ${winner} の勝利！`;
                    message = `最終スコア - X: ${this.scores.X}, O: ${this.scores.O}`;
                }
                
                this.modalTitleElement.textContent = title;
                this.modalMessageElement.textContent = message;
                this.modalElement.classList.remove('hidden');
            }
            
            hideModal() {
                this.modalElement.classList.add('hidden');
            }
            
            updateDisplay() {
                this.currentTurnElement.textContent = this.currentPlayer;
                this.scoreXElement.textContent = this.scores.X;
                this.scoreOElement.textContent = this.scores.O;
                this.updatePowerupDisplay();
                
                if (this.gameActive) {
                    const playerName = this.gameMode === 'human' || this.currentPlayer === 'X' ? 
                        `プレイヤー ${this.currentPlayer}` : 'AI';
                    this.gameStatusElement.textContent = `${playerName}のターンです`;
                }
            }
            
            updatePowerupDisplay() {
                const currentPlayerPowerups = this.powerups[this.currentPlayer];
                
                document.getElementById('remove-count').textContent = currentPlayerPowerups.remove;
                document.getElementById('double-count').textContent = currentPlayerPowerups.double;
                document.getElementById('block-count').textContent = currentPlayerPowerups.block;
                
                // パワーアップアイテムの有効/無効状態を更新
                document.querySelectorAll('.powerup-item').forEach(item => {
                    const powerupType = item.dataset.powerup;
                    const isDisabled = currentPlayerPowerups[powerupType] <= 0 || 
                                     (!this.gameActive) || 
                                     (this.gameMode !== 'human' && this.currentPlayer === 'O');
                    
                    if (isDisabled) {
                        item.classList.add('disabled');
                    } else {
                        item.classList.remove('disabled');
                    }
                });
            }
            
            resetScores() {
                this.scores = { X: 0, O: 0 };
                this.updateDisplay();
            }
        }
        
        // ゲーム開始
        document.addEventListener('DOMContentLoaded', () => {
            new TicTacToeGame();
        });