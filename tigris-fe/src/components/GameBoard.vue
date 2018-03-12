<template>
  <div class="game-board">

		<div id="game-board-canvas">
			<div id="playing-field">
				<div id="containment-wrapper">
				</div>
			</div>
		</div>
	
  </div>
</template>

<script>
import ioClient from 'socket.io-client'
import _ from 'lodash';

export default {
  name: 'GameBoard',
  data () {
    return {
      msg: 'Welcome to Your Vue.js App', 
			gameBoard: null, 
			offsetX: 82, 
			offsetY: 119, 
			width: 40, 
			height: 40, 
			tileCount: 0,
			stackOffset: 4, 
			socket: null, 
			sync: {userId: null, from: null, to: null}, 
    }
  }, 
	methods: {
		placeGamePiece(gp, x, y) {
			$(gp).css({ position: 'absolute', left: x*40, top: y*40})
			this.applyOffset($(gp), x, y);
			// this.resetOffset($(gp), x, y);
      let bp, ap = null;

      bp = this.getBoardGamePieces().map(el => el[0].id);
			this.gameBoard[y][x].push ( $(gp) );
      ap = this.getBoardGamePieces().map(el => el[0].id);

      if (bp.length === ap.length) {
      }
		}, 
		applyOffset (gp, x, y) {
      console.log(["applyOffset (gp, x, y) {:", gp, x, y])
			let stackOffset = this.gameBoard[y][x].length * this.stackOffset;
			let left = parseInt($(gp).css('left').replace(/px/, ''));
			let top = parseInt($(gp).css('top').replace(/px/, ''));

			$(gp).css({ left: (left + stackOffset) + 'px', top: (top + stackOffset) + 'px' });
		}, 
    renderTileVisibility (row) {
      const self = this;
      // refresh tile visibility for the row
      let zIndex = 0;
      for (let col=15; col>=0; col-=1) {
        // for (let tileidx=self.gameBoard[row][col].length-1; tileidx>=0; tileidx-=1) {
        for (let tile of self.gameBoard[row][col]) {
          // let tile = self.gameBoard[row][col][tileidx];
          $(tile).css('z-index', zIndex);
          zIndex += 1;
        }
      }
    }, 
    onDropped (gpJq, x, y, fromSelf=true, asgroup=false) {
      const gp = gpJq[0];
      console.log(["onDropped:", gpJq, gp, x, y, fromSelf, asgroup])
      const self = this;

      // determine where in the game board data that tile should go
      x = Math.floor(x / self.width)
      y = Math.floor(y / self.height)
			const coords = {x, y};

			self.sync.to = {x, y};

			// place tile; apply offset if it was placed on a stack
			$(gp).css({left: x * self.width, top: y * self.height})
			self.applyOffset(gp, x, y);

			// add to game board data grid
			self.gameBoard[y][x].push (gpJq);

			if (fromSelf === true) {
        this.socket.emit('sync', {userId: self.sync.userId, cmd: 'moveto', args: {domId: `${gp.id}`, to: coords, gameBoard: self.serializeGameBoard()} });
			}

      self.renderTileVisibility(y);

    },
    onAdd (gp, x, y, fromSelf=true) {
    },
    onMark (gp, x, y, fromSelf=true) {
    },
    onUnmark (gp, x, y, fromSelf=true) {
    },
    onRemove (gp, x, y, fromSelf=true, asGroup=false) {
    },
    initGameBoard () {
      if (_.isNil(this.gameBoard)) {
        this.gameBoard = [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], ];
      }
      
			// initialize gameBoard data
			for (let idx=0; idx<352; idx+=1) {
				let x = (idx % 16)
				let y = Math.floor(idx / 16)
				this.gameBoard[y][x] = [];
			}
    },
    onPickupStart (gpJq, x, y, fromSelf=true, asGroup=false) {
      const gp = gpJq[0];
      const self = this;
			const coords = {x, y};

			if (fromSelf === true) {
				// determine where in the game board data that tile should go
				x = Math.floor(x / self.width)
				y = Math.floor(y / self.height)
			}

			self.sync.from = {x, y};

			if (fromSelf === true) {
        this.socket.emit('sync', {userId: self.sync.userId, cmd: 'movefrom', args: {domId: `${gp.id}`, from: self.sync.from, gameBoard: self.serializeGameBoard()} });
			}

			self.gameBoard[y][x].pop();

    },
    renderGamePiece (gamePieceId, coords) {
      const tiles = $( "#containment-wrapper" ).append(' <div id="game-piece-' + gamePieceId + '" class="game-piece game-piece-treasure draggable ui-widget-content"> <p>' + gamePieceId + '</p> </div> ');
      const gp = $(tiles).children().last();
      this.placeGamePiece (gp, ...coords);
      return gp;
    },
    onInit () {
      const self = this;

      if (_.isNil(this.gameBoard)) { 
        self.initGameBoard(); 
      }

      this.socket.emit('getData', {userId: this.sync.userId, cmd: 'nextGamePieceId', args: {cnt: 12}, cb: 'onInit02' });
    },
    serializeGameBoard () {
      let gameBoardForServer = this.gameBoard.map((row, y) => {
        return row.map((col, x) => {
          return col.map((gp) => {
            return gp[0].id;
          });
        });
      });
      return gameBoardForServer;
    },
    deserializeGameBoard (serializedGameBoard) {
      let gameBoardForServer = serializedGameBoard.map((row, y) => {
        return row.map((col, x) => {
          return col.map((gp) => {
            return $(gp[0].id);
          });
        });
      });
      return gameBoardForServer;
    },
    onInit02 (data) {
      const self = this;
      let gamePieceIds = data.nextGamePieceIds;
      let gpIds = _.reverse(gamePieceIds);
      
			// place tiles on game board
			for (let idx=0; idx<6; idx+=1) {
        self.renderGamePiece (gpIds.pop(), [2, 2]);
			}
      self.renderTileVisibility(2);

      [ 
        [1, 1], 
        [5, 2], 
        [10, 0], 
        [15, 1], 
        [1, 7], 
      ].forEach((coords) => {
        self.renderGamePiece (gpIds.pop(), coords);
        self.renderTileVisibility(coords[1]);
      });

      let monumentTile = $( "#containment-wrapper" ).append(' <div id="game-piece-' + gpIds.pop() + '" class="game-piece game-piece-monument draggable ui-widget-content"> <p>M</p> </div> ');
      self.placeGamePiece ($(monumentTile).children().last(), 4, 4);
      self.renderTileVisibility(4);
	
      const gameBoardForServer = self.serializeGameBoard();

      console.log(['gameBoardForServer', gameBoardForServer]);
      this.socket.emit('sync', {userId: this.sync.userId, cmd: 'set', args: {gameBoard: gameBoardForServer} });

      self.setGamePieceEvents()
    },
    setGamePieceEvents () {
      const self = this;
			// define draggable behavior
			$( ".game-piece" ).draggable({ 
				containment: "#containment-wrapper", 
				scroll: false, 
				opacity: 0.7,
				stack: '#containment-wrapper div', 
				grid: [ 40, 40 ], 
				start: function( event, ui ) {
          const gp = ui.helper[0];
          self.onPickupStart (ui.helper, gp.offsetLeft, gp.offsetTop);
				}
			});
			
			$( "#playing-field" ).droppable({
				drop: function( event, ui ) {
          // const gp = ui.helper[0];
          self.onDropped (ui.helper, event.clientX - self.offsetX, event.clientY - self.offsetY);
				}
			});
    },
    getBoardGamePieces (gameBoard = this.gameBoard){
      let report = gameBoard.map((row) => {
        let res, res2 = null;
        res2 = [];
        res = row.filter(entry => entry.length > 0)

        if (!_.isNil(res) && res.length > 0) {
          res2 = (res || []).reduce((collection, arr) => collection.concat(arr));
        }
        return res2
      })
      report = report.filter(entry => entry.length > 0)

      if (!_.isNil(report) && report.length > 0) {
        report = report.reduce((collection, arr) => collection.concat(arr));
      }

      return report;
    },
    syncGameBoard (gameBoard, newGamePieces){
      
      this.initGameBoard();

      gameBoard.forEach((row, y) => {
        row.forEach((col, x) => {
          col.forEach((gpId) => {
            if (_.includes(newGamePieces, gpId)) {
              console.log(['gpId', gpId]);
              let gpIdx = gpId.match(/^game-piece-(.+)$/)[1];
              this.renderGamePiece (gpIdx, [x, y]);
              this.renderTileVisibility(y);
            }
          });
        });
      });
    },
    hello (data){
			if (this.sync.userId === null) {
				this.sync.userId = data.userId;
			}

      if (this.gameBoard === null) {
        if (_.isNil(data.gameBoard)) {
          this.onInit();
        } else {
          console.log(['data.gameBoard', data.gameBoard])
          // TODO: serialize as needed; more efficient?
          // TODO: create tiles missing on client that were created by someone else

          // current player gps
          let playerGps = null;
          if (!_.isNil(this.gameBoard)) {
            playerGps = this.getBoardGamePieces();
          }
          
          // server gps
          let serverGps = null;
          if (!_.isNil(data.gameBoard)) {
            serverGps = this.getBoardGamePieces(data.gameBoard);
            // this.gameBoard = this.deserializeGameBoard(data.gameBoard);
          }

          let newGps = serverGps.filter(gpId => !_.includes(playerGps, gpId))
          console.log(['newGps', playerGps, serverGps, newGps, data.gameBoard]);

          this.syncGameBoard(data.gameBoard, newGps);

          // this.socket.emit('getData', {userId: this.sync.userId, cmd: 'nextGamePieceId', args: {cnt: 3}, cb: 'blah' });
          // if (_.isNil(playerGps) && !_.isNil(serverGps)) {
          //   serverGps.forEach((gpId, idx) => {
          //     let gpIdx = gpId.match(/^game-piece-(.+)$/)[1];
          //     let gp = this.renderGamePiece (gpIdx, [((idx <= 5) ? 1 : 2), 10]);
          //   })
          //   this.renderTileVisibility(10);
          // }

          this.setGamePieceEvents()
        }
      }
		},
    blah () {
		}, 
    getData (data){
			switch (data.cmd) {
				case 'nextGamePieceId':
					let cb = data.cb;
          let nextGamePieceIds = data.args.gamePieceIds;
          this[cb]({nextGamePieceIds});
					break;
			}
		}, 
    syncGame (data){
			let domId, toX, toY, fromX, fromY, gameBoard, gp = null;

			if (data.userId === this.sync.userId) {
				return;
			}
			switch (data.cmd) {
				case 'moveto':
					toX = data.args.to.x;
					toY = data.args.to.y;
					domId = data.args.domId;
					gameBoard = data.args.gameBoard;
					gp = $(`#${domId}`)
          console.log(["domId:", `#${domId}`, gp, toX, toY, data.args])

					// TODO: need to have another way to deal with conflicts when two or more players
					// 		are attempting to move the same piece at the same time
          this.onDropped (gp, toX * this.width , toY * this.height, false);
					break;

				case 'movefrom':
					fromX = data.args.from.x;
					fromY = data.args.from.y;
					domId = data.args.domId;
					gp = $(domId)

          this.onPickupStart (gp, fromX, fromY, false);
					break;
			}
		},
	}, 
	mounted () {
		const self = this;

		this.socket = ioClient.connect("http://tigris.reliacode.com:8082");

		this.socket.on('hello', self.hello);
		this.socket.on('sync', self.syncGame);
		this.socket.on('getData', self.getData);
    this.socket.emit('hello', { greeting: 'hi' });
	}
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style >
body {
	font-family: Arial, Helvetica, sans-serif;
}

.ui-draggable, .ui-droppable {
	background-position: top;
}

/* .draggable { width: 38px; height: 38px; float: left; margin: 0; } */
.game-piece { width: 38px; height: 38px; }
.game-piece-monument { width: 78px; height: 78px; }
.draggable { position: absolute; top: 0; left: 0; margin: 0; }
#game-board-canvas { width: 800px; height:561px; border:2px solid #ccc;
  background-image: url("../assets/game-board.png");
	background-repeat: no-repeat;
	background-size: 800px 561px;
}
#playing-field, 
#containment-wrapper { 
	width: 645px;
	height: 640px;
}
#playing-field {
	position: relative;
	left: 72px;
  top: 57px;	
  /* border: 2px solid blue; */
}
h3 { clear: left; }
.spacer-x {
	width: 5px;
	height: 38px;
	position: relative;
	float: left;
}
.spacer-y {
	height: 5px;
	width: 38px;
	position: relative;
}
.game-piece-treasure {
  background-color: yellow;
}

</style>
