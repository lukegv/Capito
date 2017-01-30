// Defines the component to show and edit a change
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
		// Gets a string representing the change description
		description: function() {
			return this.model.description ? this.model.description : '???';
		},
		// Gets the color of the change category
		color: function() {
			return colorize(this.model.category);
		}
	},
	methods: {
		// Emits the message to destroy this change
		destroy: function() {
			this.editable = false;
			this.$emit('destroyed', this.index);
		},
		// Sets the option to edit the change
		edit: function(on) {
			this.editable = on;
		}
	}
});

// Defines the component to show and edit a version
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
		// Gets a string representing the version date
		date: function() {
			return new Date(this.model.date).toLocaleDateString();
		},
		// Gets a string representing the version name
		name: function() {
			return this.model.name ? this.model.name : '???';
		}
	},
	methods: {
		// Adds a new change to the version
		add: function() {
			this.model.changes.push({ description: '', category: '', tags: [] });
		},
		// Sets the option to edit the version
		edit: function(on) {
			this.editable = on;
			if(!on) this.$emit('edited');
		},
		// Emits the message to destroy this version
		destroy: function() {
			this.editable = false;
			this.$emit('destroyed', this.index);
		},
		// Removes a change of this version
		remove: function(index) {
			this.model.changes.splice(index, 1);
		}
	}
});

// 
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
	created: function() {
		// Sort the versions on creation
		this.sort();
	},
	data: function() {
		return { editable: false }
	},
	computed: {
		// Gets a string representation for the changelog name
		name: function() {
			return this.model.name ? this.model.name : '???';
		}
	},
	methods: {
		// Adds a new version to the changelog
		add: function() {
			this.model.versions.unshift({ name: '', date: '', changes: [] });
			this.sort();
		},
		// Sets the option to edit the changelog
		edit: function(on) {
			this.editable = on;
		},
		// Creates a link to the anchor of a version
		link: function(version) {
			return '#' + version.name;
		},
		// Removes a version of the changelog
		remove: function(index) {
			this.model.versions.splice(index, 1);
		},
		// Sorts the versions of the changelog by their name
		sort: function() {
			this.model.versions = this.model.versions.sort(compare);
		},
		// Saves the changelog
		save: function() {
			$.post('/log', JSON.stringify(this.model));
		}
	}
});

/** Determines a bootstrap label class to colorize a change category according to the category value */
function colorize(name) {
	// Color: dark blue
	if (['Feature', 'Add', 'Added', 'New', 'Dev'].indexOf(name) >= 0) {
		return 'label-primary';
	}
	// Color: green
	if (['Fixed', 'Bugfix', 'Fix'].indexOf(name) >= 0) {
		return 'label-success';
	}
	// Color: red
	if (['Security', 'Warning'].indexOf(name) >= 0) {
		return 'label-danger';
	}
	// Color: yellow
	if (['Removed', 'Remove', 'Deprecated', 'Missing'].indexOf(name) >= 0) {
		return 'label-warning';
	}
	// Color: light blue
	if (['Changed', 'Change', 'Tweak'].indexOf(name) >= 0) {
		return 'label-info';
	}
	// Color: gray
	return 'label-default';
}

/** Compares two version by their name (for sorting) */
function compare(v1, v2) {
	// If a name if missing, the version should be on top
	if (!v1.name) return -1;
	if (!v2.name) return 1;
	return -v1.name.localeCompare(v2.name);
}