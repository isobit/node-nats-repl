import NATS from 'nats';
import readline from 'readline';
import program from 'commander';
import colors from 'colors';
import util from './util';

export function main() {

	program
		.version('0.0.1')
		.option('-s, --server <uri>', 'specify NATS uri')
		.parse(process.argv);

	var hist = {
		data: [],
		idx: 0,
		push(v) {
			this.data.push(v);
			this.idx = this.data.length;
		},
		prev() {
			return this.data[this.idx = Math.max(0, this.idx - 1)];
		},
		next() {
			return this.data[this.idx = Math.min(this.data.length, this.idx + 1)];
		}
	};

	var rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});

	process.stdin.on('data', function(key){
		if (key == '\u001B\u005B\u0041') {
			rl.write(null, {ctrl: true, name: 'u'});
			rl.write(hist.prev());
		}
		if (key == '\u001B\u005B\u0042') {
			rl.write(null, {ctrl: true, name: 'u'});
			rl.write(hist.next());
		}
	});

	rl.on('close', () => {
		nats.close();
		process.exit(0);
	});
	rl.on('line', line => {
		function next() {
			hist.push(line);
			rl.prompt();
		}
		function runCancelable(f, onCancel) {
			let done = function() {
				rl.removeListener('SIGINT', sigintHandler);
				next();
			}
			let sigintHandler = function() {
				onCancel();
				done();
			}
			rl.on('SIGINT', sigintHandler);
			f(done);
		}
		var argv = line.trim().split(' ');
		switch (argv[0]) {
			case "pub":
				nats.publish(argv[1], argv[2]);
				break;
			case "sub":
				(function() {
					var sid;
					runCancelable(
						done => {
							sid = nats.subscribe(argv[1], (msg, reply, subject) => {
								console.log(`[${subject}]: ${msg}`);
							});
							nats.once('disconnect', done);
						},
						() => {
							nats.unsubscribe(sid);
						}
					);
				})();
				return;
			case "req":
				(function() {
					var sid;
					runCancelable(
						done => {
							sid = nats.request(argv[1], argv[2], {max: argv[3] || 1}, msg => {
								console.log(msg); 
								done();
							});
						},
						() => {
							nats.unsubscribe(sid);
						}
					);
				})();
				return;
			case "help":
				if (argv.length > 1) {
					switch (argv[1]) {
						case "pub":
							console.log("pub <subject> <message>");
							break;
						case "sub":
							console.log("sub <subject>");
							break;
						case "req":
							console.log("req <subject> <message>");
							break;
						default:
							console.log(`unknown command: ${argv[1]}`);
							break;
					}
				} else {
					console.log("available commands: pub, sub, req, exit");
				}
				break;
			case "exit":
				rl.close();
				return;
			default:
				console.log("unknown command " + argv[0]);
				break;
		}
		next();
	});

	var nats = NATS.connect(program.server);

	function ping() {
		if (!nats || !nats.pongs) return;
		nats.sendCommand('PING\r\n');
		nats.pongs.push(null);
	}
	setInterval(function() {
		if (nats && nats.pongs && nats.pongs.length > 5)
			return nats.stream.end();
		ping();
	}, 1000);

	function attachDisconnectHandler() {
		nats.once('disconnect', () => {
			rl.pause();
			rl.clearLine(process.stdout, 0);
			util.warn("Disconnected from server, attempting reconnect...");
			nats.once('reconnect', () => {
				rl.resume();
				rl.prompt();
				attachDisconnectHandler();
			});
		});
	}
	nats.on('close', () => {
		util.error("Connection was closed");
		rl.close();
	});
	nats.on('error', e => {
		rl.clearLine(process.stdout, 0);
		util.error(e);
		rl.close();
	});
	nats.on('connect', () => {
		util.info("Connected to server " + nats.url.href);
		attachDisconnectHandler();
		rl.setPrompt('> ');
		rl.prompt();
	});
}
