import _ from 'lodash';

module.exports = function (io) {

	console.log("should be listening for connections");
	let nextUserId = 1000;
  let gameBoard = null;
  let gamePieceIdx = 0;
  let movefrom = {};

  const initGameBoard = (data) => {
    gameBoard = JSON.parse(JSON.stringify(data));

  }

  const gameBoardDiff = (record, dirty) => {
		// console.log(['gameBoardDiff', record, dirty]);

    let diffGameBoard = [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], ]
    record.forEach((row, x) => {
      row.forEach((col, y) => {
        if (!_.isEqual(col, dirty[y][x])) {
          // console.log(['asdf', ])
          diffGameBoard[y][x] = dirty[y][x];
        }
      });
    });
    return diffGameBoard;
  };
  
	io.on('connection', function(socket){
		console.log('a user connected');

		socket.on('disconnect', function(){
			console.log('user disconnected');
		});

		socket.on('hello', function(data){
			console.log(['hello received', data]);

			socket.emit('hello', {greeting: 'Nice to see you again', userId: nextUserId+=1, gameBoard});
		});

		socket.on('getData', function(data){
			console.log(['getData command received']);//, JSON.stringify(data)]);

			switch (data.cmd) {
				case 'nextGamePieceId':
          let gamePieceIds = [];
          if (_.has(data.args, 'cnt')) {
            gamePieceIds = _.range(data.args.cnt).map(()=>gamePieceIdx++);
          } else {
            gamePieceIds.push (gamePieceIdx++);
          }
					io.emit('getData', {userId: data.userId, cmd: 'nextGamePieceId', args: {gamePieceIds, ...data.args}, cb: data.cb||null});
					break;
			}
		});

		socket.on('sync', function(data){
			console.log(['sync command received', JSON.stringify(data)]);
      const domId = data.args.domId;

			switch (data.cmd) {
				case 'set':
          if (gameBoard === null) { initGameBoard(data.args.gameBoard); };
					// io.emit('sync', {userId: data.userId, cmd: 'movefrom', args: data.args});
					break;

				case 'movefrom':
          if (!_.has(movefrom, data.userId)) {
            movefrom[data.userId] = {};
          }

          movefrom[data.userId][domId] = data.args;
          console.log(['asdf'])

					io.emit('sync', {userId: data.userId, cmd: 'movefrom', args: data.args});
					break;

				case 'moveto':
          let toX = data.args.to.x;
          let toY = data.args.to.y;

          if (_.has(movefrom[data.userId], domId)){
            let data2 = movefrom[data.userId][domId]
            console.log(['moveto:data2', data2])
            let fromX = data2.from.x;
            let fromY = data2.from.y;
            gameBoard[fromY][fromX] = gameBoard[fromY][fromX].filter(gp => gp !== domId);
            console.log([`moveto: removed game piece ${domId} from ${fromX}, ${fromY}`])
          }

          gameBoard[toY][toX].push (domId);
          console.log([`moveto: added game piece ${domId} to ${toX}, ${toY}`])
          
          // let diff = gameBoardDiff(gameBoard, data.args.gameBoard);
					io.emit('sync', {userId: data.userId, cmd: 'moveto', args: {gameBoard, ...data.args} });
					break;
			}
		});
	});

}
