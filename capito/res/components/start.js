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
		hover: function(on) {
			this.hovered = on;
		},
		select: function(name) {
			self = this;
			$.get('/log?name=' + name, (changelog) => { self.$emit('open', changelog); });
		},
		remove: function(name) {
			self = this;
			$.post('/delete?name=' + name, () => { self.$emit('removed'); });
		}
	}
});

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
				<p v-else style="text-align: center;">\
					<span class="glyphicon glyphicon-exclamation-sign" /> No changelog found!\
				</p>\
			</div>\
		</div>\
	',
	data: function() { 
		return { 
			all: [],
			query: ''
		};
	},
	computed: {
		result: function() { 
			return this.all.filter(name => name.includes(this.query));
		}
	},
	methods: {
		load: function() {
			self = this;
			$.get('/list', result => { self.all = result; });
		},
		open: function(changelog) {
			this.$emit('open', changelog);
		},
		removed: function() {
			this.load();
		}
	}
});

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
		</div>\
	',
	data: function() {
		return {
			url: '',
			processing: false
		};
	},
	methods: {
		request: function() {
			this.processing = true;
			self = this;
			$.get('/parse?url=' + this.url, function(result) {
				self.processing = false;
			}).always(function() {
				self.processing = false;
			});
		}
	}
});

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
		open: function(changelog) {
			this.$emit('open', changelog);
		}
	}
});