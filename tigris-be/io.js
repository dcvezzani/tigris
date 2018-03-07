module.exports = function (io) {

	console.log("should be listenting for connections");
	io.on('connection', function(socket){
		console.log('a user connected');

		socket.on('disconnect', function(){
			console.log('user disconnected');
		});

		socket.on('hello', function(data){
			console.log(['hello received', data]);

			socket.emit('hello', {greeting: 'Nice to see you again'});
		});
	});

}
