function traverse(arr, f) {
	for (let i = 0; i < arr.length; i++) {
		let r = f(arr[i]);
		if (r !== null) return r;
	}
}
export default function match(patterns) {
	return function(o) {
		return traverse(patterns, p => {
			if (p.constructor !== Array)
				return (typeof(p) === 'function')? p(o) : p;
			let m = (typeof(p[0]) === 'function')?
				p[0](o) :
				o === p[0];
			if (m) {
				return (typeof(p[1]) === 'function')?
					p[1](o) :
					p[1];
			}
			return null;
		});
	}
}

