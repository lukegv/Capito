// Defines a component to select a changelog view
Vue.component('view-opt', {
	props: ['view', 'mode', 'text'],
	template: '\
		<li :class="{ active: view.is(mode) }">\
			<a @click="set" role="button">{{text}}</a>\
		</li>\
	',
	methods: {
		// Sets the linked view to this option
		set: function() {
			this.view.mode = this.mode;
		}
	}
});

// Defines the capito navigation bar component
Vue.component('navbar', {
	props: ['view'],
	template: '\
		<nav class="navbar navbar-default">\
			<div class="container-fluid">\
				<div class="navbar-header">\
					<a class="navbar-brand" role="button">Capito</a>\
				</div>\
				<div class="collapse navbar-collapse">\
					<ul class="nav navbar-nav">\
						<li class="dropdown">\
							<a role="button" class="dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">\
								Switch view <span class="caret"/>\
							</a>\
							<!-- View options -->\
			        		<ul class="dropdown-menu">\
								<view-opt :mode="0" text="Classical" :view="view" />\
								<view-opt :mode="1" text="Timeline" :view="view" />\
			        		</ul>\
			        	</li>\
			        </ul>\
					<!-- Actions -->\
					<div class="nav navbar-nav navbar-right">\
						<button type="button" class="btn btn-default navbar-btn" @click="list">\
							<span class="glyphicon glyphicon-list"/>\
						</button>\
						<button type="button" class="btn btn-default navbar-btn" @click="parse">\
							<span class="glyphicon glyphicon-cloud-download"/>\
						</button>\
						<button type="button" class="btn btn-default navbar-btn" @click="empty">\
							<span class="glyphicon glyphicon-file"/>\
						</button>\
					</div>\
				</div>\
			</div>\
		</nav>\
	',
	methods: {
		// Emits the message to open the list menu
		list: function() {
			this.$emit('menu', 0);
		},
		// Emits the message to open the parse menu
		parse: function() {
			this.$emit('menu', 1);
		},
		// Emits the message to open an empty changelog
		empty: function() {
			this.$emit('empty');
		}
	}
});