// Defines a directive to focus an input element on DOM insertion
Vue.directive('focus', {
	inserted: function(el) {
		el.focus();
		el.selectionStart = el.value.length;
	}
});

var capito = new Vue({
	el: '#capito',
	data: {
		changelog: null,
		view: modes(),
		start: modes()
	},
	methods: {
		empty: function() {
			this.changelog = { name: 'New changelog', versions: [] };
		},
		menu: function(mode) {
			this.changelog = null;
			this.start.set(mode);
		},
		open: function(changelog) {
			this.changelog = changelog;
		}
	}
});

function modes() {
	return {
		mode: 0,
		set: function(mode) { this.mode = mode; },
		is: function(mode) { return this.mode == mode; }
	}
}
