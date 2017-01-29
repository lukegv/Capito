Vue.component('change', {
	props: ['model', 'index'],
	template: '\
		<li>\
			<div class="well" v-if="editable" >\
				<textarea type="text" class="form-control span" placeholder="Description" v-focus v-model.trim="model.description" \
					@keyup.enter="edit(false)" @focus="edit(true)" @blur="edit(false)" />\
				<div>\
					<input type="text" class="form-control span" placeholder="Category" v-model.trim="model.category" \
						@keyup.enter="edit(false)" @focus="edit(true)" @blur="edit(false)" />\
					<button type="button" class="btn btn-danger btn-xs space" @click.prevent="destroy" @focus="edit(true)">\
						<span class="glyphicon glyphicon-trash" />\
					</button>\
				</div>\
			</div>\
			<div class="free" v-else @click="edit(true)" >\
				<span>{{description}}</span>\
				<span class="label space" :class="color">{{model.category}}</span>\
				<span v-for="tag in model.tags" class="badge space">{{tag}}</span>\
			</div>\
		</li>\
	',
	data: function() {
		return {
			editable: false
		};
	},
	computed: {
		description: function() {
			return this.model.description ? this.model.description : '???';
		},
		color: function() {
			return colorize(this.model.category);
		}
	},
	methods: {
		destroy: function() {
			this.editable = false;
			this.$emit('destroyed', this.index);
		},
		edit: function(on) {
			this.editable = on;
		}
	}
});

Vue.component('version', {
	props: ['model', 'index'],
	template: '\
		<div class="free" :id="model.name">\
			<div>\
				<div v-if="editable">\
					<input type="text" class="h4 form-control" placeholder="Name" v-focus v-model.trim="model.name" \
						@keyup.enter="edit(false)" @blur="edit(false)" @focus="edit(true)" />\
					<input type="text" class="h4 form-control" placeholder="Date" v-model.trim="model.date" \
						maxlength="10" @keyup.enter="edit(false)" @blur="edit(false)" @focus="edit(true)" />\
					<button type="button" class="btn btn-danger btn-xs space" @click.prevent="destroy" @focus="edit(true)">\
						<span class="glyphicon glyphicon-trash" />\
					</button>\
				</div>\
				<h4 v-else @click="edit(true)">\
					Version {{name}} ({{date}})\
				</h4>\
			</div>\
			<ul>\
				<change v-for="(change, index) in model.changes" :model="change" :index="index" @destroyed="remove" />\
				<li class="free">\
					<button type="button" class="btn btn-xs btn-default" @click="add">\
						<span class="glyphicon glyphicon-plus" /> Add change\
					</button>\
				</li>\
			</ul>\
		</div>\
	',
	data: function() {
		return {
			editable: false
		};
	},
	computed: {
		date: function() {
			return new Date(this.model.date).toLocaleDateString();
		},
		name: function() {
			return this.model.name ? this.model.name : '???';
		}
	},
	methods: {
		add: function() {
			this.model.changes.push({ description: '', category: '', tags: [] });
		},
		edit: function(on) {
			this.editable = on;
			if(!on) this.$emit('edited');
		},
		destroy: function() {
			this.editable = false;
			this.$emit('destroyed', this.index);
		},
		remove: function(index) {
			this.model.changes.splice(index, 1);
		}
	}
});

Vue.component('classic', {
	props: ['model'],
	template: '\
		<div class="well">\
			<div class="row">\
				<!-- Links -->\
				<div class="col-md-2">\
					<div class="list-group">\
						<a v-for="version in model.versions" v-if="version.name" \
							class="list-group-item" :href="link(version)">\
							{{version.name}}\
						</a>\
					</div>\
				</div>\
				<!-- Changelog -->\
				<div class="col-md-8">\
					<div>\
						<input v-if="editable" type="text" class="h1 form-control" placeholder="Name" \
							v-focus v-model.trim="model.name" @keyup.enter="edit(false)" @blur="edit(false)" />\
						<h1 v-else @click="edit(true)">{{name}}</h1>\
					</div>\
					<button type="button" class="btn btn-default" @click="add">\
						<span class="glyphicon glyphicon-plus" /> Add version\
					</button>\
					<version v-for="(version, index) in model.versions" :model="version" :index="index" \
						@edited="sort" @destroyed="remove" />\
				</div>\
				<!-- Actions -->\
				<div class="col-md-2">\
					<button type="button" class="btn btn-default pull-right" :class="{ disabled: !model.name }" @click="save">\
						<span class="glyphicon glyphicon-floppy-save" /> Save\
					</button>\
				</div>\
			</div>\
		</div>\
	',
	data: function() {
		return { editable: false }
	},
	computed: {
		name: function() {
			return this.model.name ? this.model.name : '???';
		}
	},
	methods: {
		add: function() {
			this.model.versions.unshift({ name: '', date: '', changes: [] });
			this.sort();
		},
		edit: function(on) {
			this.editable = on;
		},
		link: function(version) {
			return '#' + version.name;
		},
		remove: function(index) {
			this.model.versions.splice(index, 1);
		},
		sort: function() {
			this.model.versions = this.model.versions.sort(compare);
		},
		save: function() {
			$.post('/log', JSON.stringify(this.model));
		}
	}
});

function colorize(name) {
	if (name == 'Security') {
		return 'label-danger';
	} else if (name == 'Feature') {
		return 'label-primary';
	} else if (name == 'Bugfix') {
		return 'label-success';
	} else {
		return 'label-default';
	}
}

function compare(v1, v2) {
	if (!v1.name) return -1;
	if (!v2.name) return 1;
	return -v1.name.localeCompare(v2.name);
}