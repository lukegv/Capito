// Defines a component to show a changelog item
Vue.component('item', {
	props: ['name'],
	template: '\
		<li class="list-group-item" role="button" @click="select(name)" @mouseenter="hover(true)" @mouseleave="hover(false)">\
			{{name}}\
			<button v-if="hovered" type="button" class="btn btn-danger btn-xs space pull-right" @click.stop="remove(name)">\
				<span class="glyphicon glyphicon-trash" />\
			</button>\
		</li>\
	',
	data: function() {
		return { hovered: false };
	},
	methods: {
		// Sets the hover state of this changelog item
		hover: function(on) {
			this.hovered = on;
		},
		// Selects a changelog
		select: function(name) {
			self = this;
			$.get('/log?name=' + name, (changelog) => { self.$emit('open', changelog); });
		},
		// Removes a changelog
		remove: function(name) {
			self = this;
			$.post('/delete?name=' + name, () => { self.$emit('removed'); });
		}
	}
});

// Defines the list menu component
Vue.component('list', {
	props: ['active'],
	template: '\
		<div role="tabpanel" class="tab-pane row" :class="{ active: active }">\
			<div class="col-md-6 form-group">\
				<button class="btn btn-default apart" @click="load">\
					<span class="glyphicon glyphicon-refresh" /> Load changelogs\
				</button>\
				<input type="text" class="form-control apart" placeholder="Search term" v-model="query">\
			</div>\
			<div class="col-md-6 apart">\
				<ul v-if="result.length > 0" class="list-group">\
					<item v-for="name in result" :name="name" @open="open" @removed="removed" />\
				</ul>\
				<p v-else style="text-align: center; color: red;">\
					<span class="glyphicon glyphicon-exclamation-sign" /> No changelog found!\
				</p>\
			</div>\
		</div>\
	',
	created: function() {
		// Load the changelogs at the start
		this.load();
	},
	data: function() { 
		return { 
			all: [],
			query: ''
		};
	},
	computed: {
		// Gets a search query filtered changelog list
		result: function() { 
			return this.all.filter(name => name.includes(this.query));
		}
	},
	methods: {
		// Loads the saved changelogs
		load: function() {
			self = this;
			$.get('/list', result => { self.all = result; });
		},
		// Emits the message to open a changelog
		open: function(changelog) {
			this.$emit('open', changelog);
		},
		// Reloads the changelogs after a removal
		removed: function() {
			this.load();
		}
	}
});

// Defines the parse menu component
Vue.component('parse', {
	props: ['active'],
	template: '\
		<div role="tabpanel" class="tab-pane" :class="{ active: active }">\
			<input class="form-control apart" type="text" placeholder="Changelog URL" v-model="url" />\
			<button class="btn btn-default apart" :class="{ disabled: processing }" @click="request">\
				<span v-if="processing">\
					<span class="glyphicon glyphicon-cog gly-spin" /> Processing ...\
				</span>\
				<span v-else>\
					<span class="glyphicon glyphicon-cloud-download" /> Request & Parse\
				</span>\
			</button>\
			<p v-if="error" class="apart" style="color: red;">\
				<span class="glyphicon glyphicon-exclamation-sign" /> Unsuccessful parse. No changelog found!\
			</p>\
		</div>\
	',
	data: function() {
		return {
			url: '',
			processing: false,
			error: false
		};
	},
	methods: {
		// Requests the parse for an entered url
		request: function() {
			self = this;
			this.error = false;
			this.processing = true;
			$.get('/parse?url=' + this.url, function(result) {
				self.$emit('open', result);
			}).fail(function() {
				self.error = true;
			}).always(function() {
				self.processing = false;
			});
		}
	}
});

// Defines the Capito start menu component
Vue.component('start', {
	props: ['start'],
	template: '\
		<div class="well">\
			<h1>Welcome to Capito!</h1>\
			<ul class="nav nav-tabs">\
				<li role="presentation" :class="{ active: start.is(0) }">\
					<a role="button" @click="start.set(0)"><span class="glyphicon glyphicon-list" /> List</a>\
				</li>\
				<li role="presentation" :class="{ active: start.is(1) }">\
					<a role="button" @click="start.set(1)"><span class="glyphicon glyphicon-cloud-download" /> Import</a>\
				</li>\
			</ul>\
			<div class="tab-content">\
				<list :active="start.is(0)" @open="open" />\
				<parse :active="start.is(1)" @open="open" />\
			</div>\
		</div>\
	',
	methods: {
		// Emits the message tp open a changelog
		open: function(changelog) {
			this.$emit('open', changelog);
		}
	}
});