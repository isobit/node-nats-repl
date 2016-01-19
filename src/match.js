export default function match() {
	return {
		otherwiseFunc: null,
		patterns: [],
		when(m, f) {
			this.patterns.push({m: m, f: f});
			return this;
		},
		otherwise(f) {
			this.otherwiseFunc = f;
			return this;
		},
		exec(o) {
			for (var i = 0; i < this.patterns.length; i++) {
				var p = this.patterns[i];
				if (o == p.m) return p.f(o);
			}
			if (this.otherwiseFunc) return this.otherwiseFunc(o);
			return null;
		}
	};
}

