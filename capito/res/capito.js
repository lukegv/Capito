// Defines a directive to focus an input element on DOM insertion
Vue.directive('focus', {
	inserted: function(el) {
		el.focus();
		el.selectionStart = el.value.length;
	}
});

// Initializes the Capito app
var capito = new Vue({
	el: '#capito',
	data: {
		changelog: null,
		view: modes(),
		start: modes()
	},
	methods: {
		// Creates a new empty changelog and shows it
		empty: function() {
			this.changelog = { name: 'New changelog', versions: [] };
		},
		// Shows the menu
		menu: function(mode) {
			this.changelog = null;
			this.start.set(mode);
		},
		// Opens a changelog
		open: function(changelog) {
			this.changelog = changelog;
		}
	}
});

/** Creates a new mode object */
function modes() {
	return {
		mode: 0,
		set: function(mode) { this.mode = mode; },
		is: function(mode) { return this.mode == mode; }
	}
}
