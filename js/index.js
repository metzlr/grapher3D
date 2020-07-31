/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   {number}  h       The hue
 * @param   {number}  s       The saturation
 * @param   {number}  l       The lightness
 * @return  {Array}           The RGB representation
 */
function hslToRgb(h, s, l){
	var r, g, b;

	if(s == 0){
			r = g = b = l; // achromatic
	}else{
			var hue2rgb = function hue2rgb(p, q, t){
					if(t < 0) t += 1;
					if(t > 1) t -= 1;
					if(t < 1/6) return p + (q - p) * 6 * t;
					if(t < 1/2) return q;
					if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
					return p;
			}

			var q = l < 0.10 ? l * (1 + s) : l + s - l * s;
			var p = 2 * l - q;
			r = hue2rgb(p, q, h + 1/3);
			g = hue2rgb(p, q, h);
			b = hue2rgb(p, q, h - 1/3);
	}
	return [r, g, b];
	//return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function grapher() {
	"use strict";

	let scene, camera, renderer, controls, graph, stats, gui;
	let graphSettings = {
		xRangeMin: -5,
		xRangeMax: 5,
		yRangeMin: -5,
		yRangeMax: 5,
		step: 0.25,
		heightFunction: (x,y) => {
			return Math.sin(x) * Math.cos(y)*4;
		},
	}

	function init() {
		scene = new THREE.Scene();
	
		camera = new THREE.PerspectiveCamera(
			75,
			window.innerWidth / window.innerHeight,
			0.1,
			1000
		);
		camera.position.z = 10;
			
		renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.setSize(window.innerWidth, window.innerHeight);
		document.body.appendChild(renderer.domElement);

		controls = new THREE.TrackballControls(camera, renderer.domElement)
		controls.rotateSpeed = 2.0;
		controls.zoomSpeed = 1.2;
		controls.panSpeed = 0.75;
		controls.target.set( 0, 0, 0 );

		gui = new dat.GUI();
		let graphControls = gui.addFolder("Graph Settings");
		let controller = graphControls.add(graphSettings, 'xRangeMin', -100, 100).step(0.5).onFinishChange(updateGraph);
		graphControls.add(graphSettings, 'xRangeMax', -100, 100).step(0.5).onFinishChange(updateGraph);
		graphControls.add(graphSettings, 'yRangeMin', -100, 100).step(0.5).onFinishChange(updateGraph);
		graphControls.add(graphSettings, 'yRangeMax', -100, 100).step(0.5).onFinishChange(updateGraph);
		graphControls.add(graphSettings, 'step', 0.05, 2).step(0.05).onFinishChange(updateGraph);

		let directionalLightTop = new THREE.DirectionalLight( 0xffffff, 0.8 );
		directionalLightTop.position.set(0, 1, 0);
		let directionalLightBottom = new THREE.DirectionalLight( 0xffffff, 0.8 );
		directionalLightBottom.position.set(0, -1, 0);
		scene.add(directionalLightTop);
		scene.add(directionalLightBottom);

		let light = new THREE.AmbientLight( 0xffffff , 0.2); // soft white light
		scene.add( light );

		// Draw Axes
		// let axesLength = Math.max(
		// 	Math.abs(graph.range.x[0]),
		// 	Math.abs(graph.range.x[1]),
		// 	Math.abs(graph.range.y[0]),
		// 	Math.abs(graph.range.y[1]),
		// 	Math.abs(graph.heightMax),
		// 	Math.abs(graph.heightMin),
		// );
		let axesLength = 20;
		let axes = getAxes(axesLength);
		for (let i = 0; i < axes.length; i++) scene.add(axes[i]);

		stats = new Stats();
		stats.showPanel(1); // 0: fps, 1: ms, 2: mb, 3+: custom
		stats.showPanel(0);
		//stats.showPanel(2);
		document.body.appendChild( stats.dom );
		
		updateGraph();
	}
	
	function animate() {
		requestAnimationFrame(animate);

		controls.update()
		renderer.render(scene, camera);

		stats.update();
	}

	function updateGraph() {
		graph = new Graph(
			[graphSettings.xRangeMin, graphSettings.xRangeMax],
			[graphSettings.yRangeMin, graphSettings.yRangeMax],
			graphSettings.step, 
			graphSettings.heightFunction,
		);
		let oldMesh = scene.getObjectByName('graphMesh')
		if (oldMesh) {
			oldMesh.geometry.dispose();
			oldMesh.material.dispose();
			scene.remove(oldMesh);
			renderer.renderLists.dispose();
		}
		let mesh = createGraphMesh(graph);
		mesh.name = 'graphMesh';
		scene.add(mesh);
	}

	function createGraphMesh(g) {
		let geometry = new THREE.BufferGeometry();
		let vertices = [];
		let indices = [];
		let colors = [];
		// let sizeX = g.range.x/g.step;
		// let sizeY = g.range.y/g.step;
		for (let i = 0; i < g.points.length; i++) {
			let p = g.points[i];
			if (!g.pointExists(i)) p = { x: 0.0, y: 0.0, z: 0.0 };
			vertices.push(p.x, p.z, p.y);
			let color = getColorFromHeight(p, g);
			//console.log(color);
			colors.push(color[0], color[1], color[2]);
			//colors.push(0, 0, 1);
		}
		//console.log(vertices);
		for (let x = 0; x < g.pointsSize.x-1; x++) {
			for (let y = 0; y < g.pointsSize.y-1; y++) {
				let square = [
					g.getPointIndex(x, y),
					g.getPointIndex(x+1,y),
					g.getPointIndex(x+1,y+1),
					g.getPointIndex(x,y+1),
				];
				let checkExist = [
					g.pointExists(square[0]),
					g.pointExists(square[1]),
					g.pointExists(square[2]),
					g.pointExists(square[3]),
				];
				let count = 0;
				for (let i = 0; i < checkExist.length; i++) { 
					if (!checkExist[i]) count++;
				}
				if (count == 0) {
					indices.push(square[0], square[1], square[3]);
					indices.push(square[1], square[2], square[3]);
				}
			}
		}
		//console.log(indices);
		let positionBuffer = new THREE.Float32BufferAttribute(vertices, 3);
		let colorBuffer = new THREE.Float32BufferAttribute(colors, 3);
		geometry.setIndex(indices);
		geometry.setAttribute('position', positionBuffer);
		geometry.setAttribute('color', colorBuffer);
		geometry.computeVertexNormals();
		const xRangeTotal = Math.abs(g.range.x[1] - g.range.x[0]);
		const yRangeTotal = Math.abs(g.range.y[1] - g.range.y[0]);
		// Center mesh
		geometry.translate(
			-1*(g.range.x[1] - xRangeTotal/2),
			0,
			-1*(g.range.y[1] - yRangeTotal/2),
		);
		let material = new THREE.MeshPhongMaterial( {
			side: THREE.DoubleSide,
			vertexColors: true,
		});
		let mesh = new THREE.Mesh(geometry, material);
		return mesh;
	}

	function drawVertices(scene) {
		function createPointSphere(radius, color) {
			let geometry = new THREE.SphereGeometry(radius, 4, 2 );
			let material = new THREE.MeshBasicMaterial( {color: color} );
			let sphere = new THREE.Mesh( geometry, material );
			return sphere;
		}
		for (let i = 0; i < graph.points.length; i++) {
			let p = graph.points[i];
			let rgbColor = getColorFromHeight(p, graph);
			let color = new THREE.Color(rgbColor[0], rgbColor[1], rgbColor[2]);
			let sphere = createPointSphere(0.05, color);
			sphere.position.set(
				p.x, 
				p.z, 
				p.y
			);
			//console.log(sphere.position);
			scene.add(sphere);
		}
	}
	
	function getColorFromHeight(point, graph) {
		let zNorm = (point.z - graph.heightMin) / (graph.heightMax - graph.heightMin);
		// return hslToRgb(zNorm/2, 1, 0.5);
		return [1 - Math.min(1, zNorm*2), 1, Math.max(1, zNorm*2) - 1];
	}

	function getAxes(length) {
		let pointsX = [
			new THREE.Vector3(-1*length, 0, 0),
			new THREE.Vector3(length, 0, 0),
		]
		let pointsY = [
			new THREE.Vector3(0, -1*length, 0),
			new THREE.Vector3(0, length, 0),
		]
		let pointsZ = [
			new THREE.Vector3(0,0,-1*length),
			new THREE.Vector3(0,0,length),
		]
		let geometryX = new THREE.BufferGeometry().setFromPoints(pointsX);
		let materialX = new THREE.LineBasicMaterial( { color: 0x0000ff } );
		let lineX = new THREE.Line(geometryX, materialX);
		let geometryY = new THREE.BufferGeometry().setFromPoints(pointsY);
		let materialY = new THREE.LineBasicMaterial( { color: 0x00ff00 } );
		let lineY = new THREE.Line(geometryY, materialY);
		let geometryZ = new THREE.BufferGeometry().setFromPoints(pointsZ);
		let materialZ = new THREE.LineBasicMaterial( { color: 0xff0000 } );
		let lineZ = new THREE.Line(geometryZ, materialZ);
		return [lineX, lineY, lineZ];

	}

	function onWindowResize() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);

		controls.handleResize();
	}
	
	window.addEventListener('resize', onWindowResize, false);
	
	init();
	animate();
}

grapher();
