import colors from 'colors';

export default {
	verbosity: 2,
	debug(s) {
		if (this.verbosity < 3) return;
		console.log("> ".green.bold + s);
	},
	info(s) {
		if (this.verbosity < 2) return;
		console.log("=> ".blue.bold + s);
	},
	warn(s) {
		if (this.verbosity < 1) return;
		console.log("WARNING".yellow.underline + ": " + s);
	},
	error(s) {
		if (this.verbosity < 1) return;
		console.log("ERROR".red.underline + ": " + s);
	}
}
