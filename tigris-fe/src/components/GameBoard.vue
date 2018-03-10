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

export default {
  name: 'GameBoard',
  data () {
    return {
      msg: 'Welcome to Your Vue.js App', 
			gameBoard: [[], [], [], [], [], [], [], [], [], [], [], ], 
			offsetx: 82, 
			offsety: 119, 
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
			this.gameBoard[y][x].push ( $(gp) );
		}, 
		applyOffset (gp, x, y) {
			let stackOffset = this.gameBoard[y][x].length * this.stackOffset;
			// console.log(['ui css, applyOffset', $(gp).css('top'), stackOffset]);
			let left = parseInt($(gp).css('left').replace(/px/, ''));
			let top = parseInt($(gp).css('top').replace(/px/, ''));
			// console.log(['left/top, resetOffset', (left + stackOffset), (top + stackOffset)]);

			$(gp).css({ left: (left + stackOffset) + 'px', top: (top + stackOffset) + 'px' });
		}, 
    renderTileVisibility (row) {
      const self = this;
      // refresh tile visibility for the row
      let zidx = 0;
      for (let col=15; col>=0; col-=1) {
        // for (let tileidx=self.gameBoard[row][col].length-1; tileidx>=0; tileidx-=1) {
        for (let tile of self.gameBoard[row][col]) {
          // let tile = self.gameBoard[row][col][tileidx];
          $(tile).css('z-index', zidx);
          zidx += 1;
        }
      }
    }, 
    onDropped (gp, x, y, fromSelf=true) {
      var self = this;
			const coords = {x, y};

      // determine where in the game board data that tile should go
      x = Math.floor(x / self.width)
      y = Math.floor(y / self.height)

			self.sync.to = {x, y};

			if (fromSelf === true) {
        // console.log(['chk', {domId: `#${gp.id}`, from: self.sync.from, to: self.sync.to}]);
        this.socket.emit('sync', {userId: self.sync.userId, cmd: 'moveto', args: {domId: `#${gp.id}`, to: coords} });
			}


			// place tile; apply offset if it was placed on a stack
			$(gp).css({left: x * self.width, top: y * self.height})
			self.applyOffset(gp, x, y);

			// add to game board data grid
			self.gameBoard[y][x].push (gp);

      self.renderTileVisibility(y);

			console.log(['tile was dropped; added in data table', gp.id, x, y]);
    },
    onPickupStart (gp, x, y, fromSelf=true) {
      var self = this;
      console.log(['pick-up-start', gp, x, y, fromSelf]);
			const coords = {x, y};

			if (fromSelf === true) {
				// determine where in the game board data that tile should go
				x = Math.floor(x / self.width)
				y = Math.floor(y / self.height)
			}

			self.sync.from = {x, y};

			if (fromSelf === true) {
        // console.log(['chk', {userId: self.sync.userId, domId: `#${gp.id}`, from: self.sync.from}]);
        this.socket.emit('sync', {userId: self.sync.userId, cmd: 'movefrom', args: {domId: `#${gp.id}`, from: self.sync.from} });
			}

			self.gameBoard[y][x].pop();

			console.log(['tile picked up; removed from data table', gp.id, x, y]);
    },
    onInit () {
      var self = this;
			// initialize gameboard data
			for (let idx=0; idx<176; idx+=1) {
				let x = (idx % 16)
				let y = Math.floor(idx / 16)
				self.gameBoard[y][x] = [];
			}

			// place tiles on game board
			for (let idx=0; idx<6; idx+=1) {
				let chk = $( "#containment-wrapper" ).append(' <div id="game-piece-' + (self.tileCount++) + '" class="game-piece draggable ui-widget-content"> <p>' + (idx + 1) + '</p> </div> ');
				self.placeGamePiece ($(chk).children().last(), 2, 2);
			}

      let chk = $( "#containment-wrapper" ).append(' <div id="game-piece-' + (self.tileCount++) + '" class="game-piece game-piece-monument draggable ui-widget-content"> <p>M</p> </div> ');
      self.placeGamePiece ($(chk).children().last(), 4, 4);
			
	
			// define draggable behavior
			$( ".game-piece" ).draggable({ 
				containment: "#containment-wrapper", 
				scroll: false, 
				opacity: 0.7,
				stack: '#containment-wrapper div', 
				grid: [ 40, 40 ], 
				start: function( event, ui ) {
          const gp = ui.helper[0];
          self.onPickupStart (gp, gp.offsetLeft, gp.offsetTop);
				}
			});
			
			$( "#playing-field" ).droppable({
				drop: function( event, ui ) {
          const gp = ui.helper[0];
          self.onDropped (gp, event.clientX - self.offsetx, event.clientY - self.offsety);
				}
			});
    },
    hello (data){
			console.log(['hello received', data]);
			if (this.sync.userId === null) {
				this.sync.userId = data.userId;
			}
		}, 
    syncGame (data){
			let domId, toX, toY, fromX, fromY, gp = null;

			console.log(['sync command received', JSON.stringify(data)]);
			if (data.userId === this.sync.userId) {
				console.log(['event was triggered by this user; events already applied', data.userId]);
				return;
			}
			switch (data.cmd) {
				case 'moveto':
					toX = data.args.to.x;
					toY = data.args.to.y;
					domId = data.args.domId;
					gp = $(domId)

					// TODO: need to have another way to deal with conflicts when two or more players
					// 		are attempting to move the same piece at the same time
					console.log(['chk, dropped', gp, toX, toY, false]);
          this.onDropped (gp, toX, toY, false);
					break;

				case 'movefrom':
					fromX = data.args.from.x;
					fromY = data.args.from.y;
					domId = data.args.domId;
					gp = $(domId)

					console.log(['chk, pick-up-start', gp, fromX, fromY, false]);
          this.onPickupStart (gp, fromX, fromY, false);
					break;
			}
		},
	}, 
	mounted () {
		var self = this;

    self.onInit();

		this.socket = ioClient.connect("http://tigris.reliacode.com:8082");
		console.log(["should have connected to io", this.socket]);

		this.socket.on('hello', self.hello);
		this.socket.on('sync', self.syncGame);
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
	height: 440px;
}
#playing-field {
	position: relative;
	left: 72px;
  top: 57px;	
	width: 641px;
	height: 440px;
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

</style>
