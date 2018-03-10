module.exports = function (io) {

	console.log("should be listening for connections");
	let nextUserId = 1000;
	io.on('connection', function(socket){
		console.log('a user connected');

		socket.on('disconnect', function(){
			console.log('user disconnected');
		});

		socket.on('hello', function(data){
			console.log(['hello received', data]);

			socket.emit('hello', {greeting: 'Nice to see you again', userId: nextUserId+=1});
		});

		socket.on('sync', function(data){
			console.log(['sync command received', JSON.stringify(data)]);

			switch (data.cmd) {
				case 'movefrom':
					io.emit('sync', {userId: data.userId, cmd: 'movefrom', args: data.args});
					break;
				case 'moveto':
					io.emit('sync', {userId: data.userId, cmd: 'moveto', args: data.args});
					break;
			}
		});
	});

}
