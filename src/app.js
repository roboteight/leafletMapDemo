import Vue from 'vue';

import shp from 'shpjs';

import leaflet from 'leaflet';

import './../assets/app.styl';

import App from './App.vue';

import Colors from './js/sup/_colors.js';

const ownerColors = {};
const litBuildingColor = 'tomato';

new Vue({
	el: '#app',
	data: {
		map: null,
		tileLayer: null,
		layers: []
	},
	mounted() {
		this.initMap();
		this.initLayers();
	},
	methods: {
		initMap() {},
		initLayers() {}
	},
	render: h => h(App)
});

const map = L.map('map', { tilt: true }).setView([45.333672, -69.09228], 7);
const tileLayer = L.tileLayer(
	'https://cartodb-basemaps-{s}.global.ssl.fastly.net/rastertiles/voyager/{z}/{x}/{y}.png',
	{
		maxZoom: 18,
		attribution:
			'&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attribution">CARTO</a>'
	}
).addTo(map);

/* Map Feature Functions */
const onEachFeature = (feature, layer) => {
	if (feature.properties) {
		layer.bindPopup(
			Object.keys(feature.properties)
				.map(k => {
					if (k === '__color__') return;

					return k + ': ' + feature.properties[k];
				})
				.join('<br />'),
			{
				maxHeight: 200
			}
		);
	}
};

const setStyle = feature => {
	const owner = feature.properties.OWNER;
	const assignedColor = ownerColors[owner].rgb;

	feature.properties.__color__ = assignedColor;

	return {
		opacity: 1,
		fillOpacity: 0.7,
		radius: 6,
		color: feature.geometry.type === 'Point' ? 'tomato' : feature.properties.__color__
	};
};

const pointToLayer = (feature, latlng) => {
	return L.circleMarker(latlng, {
		opacity: 1,
		fillOpacity: 0.7,
		color: feature.properties.__color__
	});
};

const geo = L.geoJson(
	{ features: [] },
	{ onEachFeature: onEachFeature,
		style: setStyle,
		pointToLayer: pointToLayer
	}
).addTo(map);

const maineFiberCables = shp('./../data/maine_fiber_cables.zip').then(
	data => {
		const features = data.features;
		const owners = [];
		const colors = [];

		for (let i in features) {
			const f = features[i];
			const props = f.properties;
			const owner = props.OWNER;

			if (owners.indexOf(owner) === -1) owners.push(owner);
		}

		for (let i in owners) {
			/*TODO: should make sure no duplicate colors */
			ownerColors[owners[i]] = Colors.random();
		}

		geo.addData(data);

		addLegend();
	},
	err => {
		console.log(`Error ${err}`);
	}
);

const maineLitBuildings = shp('./../data/maine_lit_buildings.zip').then(
	data => {
		const features = data.features;
		const owners = [];
		const colors = [];

		for (let i in features) {
			const f = features[i];
			const props = f.properties;
			const owner = props.OWNER;

			if (owners.indexOf(owner) === -1) owners.push(owner);
		}

		for (let i in owners) {
			ownerColors[owners[i]] = { name: 'tomato', rgb: '#ff6347' };
		}
		geo.addData(data);
	},
	err => {
		console.log(`Error ${err}`);
	}
);

function addLegend() {
	const mapDiv = document.getElementById('map');
	const mapLegend = document.createElement('div');
	const legendDl = document.createElement('dl');
	const ownerKeys = Object.keys(ownerColors);
	const ownerVals = Object.values(ownerColors);

	for (let i in ownerKeys) {
		const oKey = ownerKeys[i] !== 'undefined' ? ownerKeys[i] : 'Lit Buildings';
		const oClr = ownerVals[i].rgb;

		const dt = document.createElement('dt');
		const dd = document.createElement('dd');
		const ownerName = document.createTextNode(
			oKey !== '' ? oKey : 'No Owner Title'
		);

		dt.style.background = oClr;
		dd.appendChild(ownerName);

		legendDl.appendChild(dt);
		legendDl.appendChild(dd);
	}

	mapLegend.classList.add('map-legend');
	mapLegend.appendChild(legendDl);

	document.body.insertBefore(mapLegend, mapDiv);
}
