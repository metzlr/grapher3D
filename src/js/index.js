import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Stats from 'three/examples/jsm/libs/stats.module'
import { GUI } from 'three/examples/jsm/libs/dat.gui.module'

import { Parser } from 'expr-eval'

import { Graph } from './graph'
import { GraphPanControls } from './graphPanControls'

import helvetiker_regular from 'three/examples/fonts/helvetiker_regular.typeface.json';

function grapher() {
	"use strict";

	let scene, camera, renderer, controls, graph, stats, gui, panControls, font;
	let axesHelper;
	let graphSettings = {
		function: '4*sin(x) * cos(y)',
		//heightFunction: (x,y) => { return 0.05*(x*x + y*y); },
		xRangeMin: -15,
		xRangeMax: 15,
		yRangeMin: -15,
		yRangeMax: 15,
		step: 1,
		showAxes: true,
	}

	const mathParser = new Parser({
		operators: {
			remainder: false,
			concatenate: false,
			conditional: false,
			logical: false,
			comparison: false,
			assignment: false,
			random: false,
			array: false,
			fndef: false,
		}
	});

	function init() {
		scene = new THREE.Scene();
		camera = new THREE.PerspectiveCamera(
			75,
			window.innerWidth / window.innerHeight,
			0.1,
			5000
		);
		camera.position.set(0, 0, 0);

		renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.setSize(window.innerWidth, window.innerHeight);
		document.body.appendChild(renderer.domElement);

		font = new THREE.Font(helvetiker_regular);
	
		controls = new OrbitControls(camera, renderer.domElement );
		camera.position.set( 0, 0, 30 );
		controls.update();
		controls.zoomSpeed = 0.25;
		controls.rotateSpeed = 0.5;
		controls.enableKeys = false;
		controls.enablePan = false;
		
		panControls = new GraphPanControls(renderer.domElement, camera, 0.1, 
			function() {	// On start pan
				controls.enabled = false;
			},
			function(panVector, shiftPressed) {	// On pan move
				graphSettings.xRangeMin += panVector.x
				graphSettings.xRangeMax += panVector.x
				graphSettings.yRangeMin += panVector.y
				graphSettings.yRangeMax += panVector.y
				updateGraph();
			},
			function() {	// On end pan
				controls.enabled = true;
			}
		);

		gui = new GUI();
		let graphControls = gui.addFolder("Graph Settings");
		graphControls.add(graphSettings, 'function').onFinishChange((value) => {
			graphSettings.heightFunction = parseFunctionString(value);
			updateGraph();
		});
		graphControls.add(graphSettings, 'xRangeMin', -100, 100).step(0.5).listen().onFinishChange(updateGraph);
		graphControls.add(graphSettings, 'xRangeMax', -100, 100).step(0.5).listen().onFinishChange(updateGraph);
		graphControls.add(graphSettings, 'yRangeMin', -100, 100).step(0.5).listen().onFinishChange(updateGraph);
		graphControls.add(graphSettings, 'yRangeMax', -100, 100).step(0.5).listen().onFinishChange(updateGraph);
		graphControls.add(graphSettings, 'step', 0.05, 2).step(0.05).listen().onFinishChange(updateGraph);
		graphControls.add(graphSettings, 'showAxes').listen().onFinishChange((val) => { axesHelper.material.visible = val; });

		let directionalLightTop = new THREE.DirectionalLight( 0xffffff, 0.8 );
		directionalLightTop.position.set(0, 1, 0);
		let directionalLightBottom = new THREE.DirectionalLight( 0xffffff, 0.8 );
		directionalLightBottom.position.set(0, -1, 0);
		scene.add(directionalLightTop);
		scene.add(directionalLightBottom);

		let light = new THREE.AmbientLight( 0xffffff , 0.2); // soft white light
		scene.add( light );

		stats = new Stats();
		stats.showPanel(1); // 0: fps, 1: ms, 2: mb, 3+: custom
		stats.showPanel(0);
		//stats.showPanel(2);
		document.body.appendChild( stats.dom );

		axesHelper = new THREE.AxesHelper(25);
		scene.add(axesHelper);
		
		graphSettings.heightFunction = parseFunctionString(graphSettings.function);
		updateGraph();
	}
	
	function animate() {
		requestAnimationFrame(animate);
		controls.update()
		renderer.render(scene, camera);
		stats.update();
	}

	function parseFunctionString(str) {
		let expr = undefined;
		try {
			expr = mathParser.parse(str);
			let vars = expr.variables().sort();
			if (vars.length > 2) {
				throw Error("Too many variables in function");
			}
			for (let i = 0; i < vars.length; i++) {
				if (vars[i] !== 'x' && vars[i] !== 'y') {
					throw Error("Unknown variables in function. Please only use \"x\" and \"y\"");
				}
			}			
			let func = expr.toJSFunction("x,y");
			return func;
		} catch (error) {
			removeGraphMesh();
			graphSettings.showAxes = false;
			axesHelper.material.visible = false;
			renderTextModel('Whoops.');
			alert("Uh oh. That isn't a valid function.");
			console.error(error);
		}
		return undefined;
	}

	function removeGraphMesh() {
		let oldMesh = scene.getObjectByName('graphMesh')
		if (oldMesh) {
			oldMesh.geometry.dispose();
			oldMesh.material.dispose();
			scene.remove(oldMesh);
			renderer.renderLists.dispose();
		}
	}

	function updateGraph() {
		if (graphSettings.heightFunction == undefined) return;
		removeGraphMesh();
		graph = new Graph(
			[graphSettings.xRangeMin, graphSettings.xRangeMax],
			[graphSettings.yRangeMin, graphSettings.yRangeMax],
			graphSettings.step, 
			graphSettings.heightFunction,
		);
		let mesh = createGraphMesh(graph);
		mesh.name = 'graphMesh';
		scene.add(mesh);
	}

	function createGraphMesh(g) {
		let geometry = new THREE.BufferGeometry();
		let vertices = [];
		let indices = [];
		let colors = [];
		for (let i = 0; i < g.points.length; i++) {
			let p = g.points[i];
			if (!g.pointExists(i)) p = { x: 0.0, y: 0.0, z: 0.0 };
			let y = Math.min(50000, p.z);
			vertices.push(p.x, y, p.y);
			let color = getColorFromHeight(p, g);
			colors.push(color[0], color[1], color[2]);
		}
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
			//wireframe: graphSettings.panning,
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
		let materialX = new THREE.LineBasicMaterial( { color: 0xff0000 } );
		let lineX = new THREE.Line(geometryX, materialX);
		let geometryY = new THREE.BufferGeometry().setFromPoints(pointsY);
		let materialY = new THREE.LineBasicMaterial( { color: 0x00ff00 } );
		let lineY = new THREE.Line(geometryY, materialY);
		let geometryZ = new THREE.BufferGeometry().setFromPoints(pointsZ);
		let materialZ = new THREE.LineBasicMaterial( { color: 0x0000ff } );
		let lineZ = new THREE.Line(geometryZ, materialZ);
		return [lineX, lineY, lineZ];

	}

	function renderTextModel(text) {
		if (font == undefined) return;
		let textGeometry = new THREE.TextGeometry(text, {
			font: font,
			size: 10,
			height: 1,
			curveSegments: 12,
			// bevelEnabled: true,
			// bevelThickness: 10,
			// bevelSize: 8,
			// bevelOffset: 0,
			// bevelSegments: 5
		});
		textGeometry.center();
		let textMaterial = new THREE.MeshPhongMaterial( { color: 0xff0000 } );
		let mesh = new THREE.Mesh(textGeometry, textMaterial);
		mesh.name = 'textMesh';
    mesh.position.set(0, 0, 0);
    scene.add(mesh);
	}

	function onWindowResize() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);

	}
	
	window.addEventListener('resize', onWindowResize, false);
	
	init();
	animate();
}

grapher();
