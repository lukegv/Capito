// Defines the Capito timeline component
Vue.component('timeline', {
	props: ['model'],
	template: '\
		<div class="content well">\
			<div id="timeline" class="row">\
				<div id="tooltip" />\
			</div>\
			<div class="row">\
				<version class="col-md-offset-2 col-md-8" v-if="selected" :model="selected" @edited="create"/>\
			</div>\
		</div>\
	',
	mounted: function() {
		// Create the timeline on start
		this.create();
	},
	data: function() {
		return {
			selected: null
		};
	},
	methods: {
		// Creates a changelog timeline
		create: function() {
			timeline(this.model.versions, sel => { this.selected = sel });
		}
	}
});

/** Build a changelog timeline */
function timeline(versions, selection) {
	// Calculate the time values (unix time)
	versions.forEach(v => v.time = new Date(v.date).getTime())
	// Filter invalid dates
	versions = versions.filter(v => !isNaN(v.time));
	var timeline = d3.select('#timeline');
	// Clear possible previous timeline
	timeline.html("");
	var canvas = timeline.append('svg')
		.attr('height', 100).attr('width', 1100);
	var tooltip = d3.select('#tooltip')
		.style('opacity', 0).style('position', 'absolute')
		.style('border-radius', '8px 8px').style('padding', '5px 10px');
	// Calculate start and end date (one month extra)
	var start = d3.min(versions.map(v => v.time)) - 30 * 24 * 60 * 60 * 1000;
	var end = d3.max(versions.map(v => v.time)) + 30 * 24 * 60 * 60 * 1000;
	// Create time line
	canvas.append('line')
		.attr('x1', 50).attr('y1', 50).attr('x2', 1050).attr('y2', 50)
		.style('stroke-width', 4).style('stroke', '#999');
	// Insert a point for each version
	canvas.selectAll('circle').data(versions).enter().append('circle')
		.attr('r', 6).attr('cx', v => x(start, end, v.time)).attr('cy', 50)
		.style('stroke-width', 4).style('stroke', '#999').style('fill', '#999')
		// Add mouse over animation
		.on('mouseover', function(v) {
			d3.select(this).transition().duration(200).attr('r', 10);
			tooltip.html('Test');
		})
		.on('mouseout', function(v) {
			d3.select(this).transition().duration(200).attr('r', 6);
		})
		// Add click handler
		.on('click', function(v) {
			selection(v);
		});
}

/** Calculates the x position on the timeline */
function x(start, end, time) {
	var range = end - start;
	return 50 + (time - start) / range * 1000;
}