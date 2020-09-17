import * as THREE from "three";
import { GraphPlotter3D } from "./GraphPlotter3D.js";
import { TextObject } from "./TextObject.js";
import { GraphPanControls } from "./graphPanControls";

class GraphObject {
  constructor(scene) {
    this.scene = scene;
    this.objectGroup = new THREE.Group();

    this.panControls = undefined;

    this._axesHelper = new THREE.AxesHelper(25);
    this.objectGroup.add(this._axesHelper);

    this._errorText = new TextObject(scene, "Error");
    this._errorText.visible = false;
    this.objectGroup.add(this._errorText.mesh);

    this._graph = undefined;
    this._graphColor = 0x3393f2;
    this._functionString = "0";
    this.range = {
      x: { min: -10, max: 10 },
      y: { min: -10, max: 10 },
      z: { min: -2000, max: 2000 },
    };
    this._step = 0.5;

    this.surfaceMesh = undefined;

    this.doTransition = true;
    this.transitionSpeed = 0.9;
    this._oldGraphPointsPoints = undefined;
    this._newGraph = undefined;
    this._transitioning = false;

    this.scene.add(this.objectGroup);
  }

  get showAxes() {
    return this._axesHelper.material.visible;
  }
  set showAxes(val) {
    this._axesHelper.material.visible = val;
  }
  get heightFunction() {
    return this._functionString;
  }
  set heightFunction(str) {
    this._functionString = str;
    this._updateGraph(this.doTransition);
  }
  get step() {
    return this._step;
  }
  set step(val) {
    this._step = val;
    this._updateGraph(false);
  }
  get graphColor() {
    return this._graphColor;
  }
  set graphColor(val) {
    this._graphColor = val;
    this._updateGraph();
  }
  get xRangeLength() {
    return this._calculateRangeLength(this.range.x);
  }
  set xRangeLength(val) {
    this._updateRangeLength(val, this.range.x);
  }
  get yRangeLength() {
    return this._calculateRangeLength(this.range.y);
  }
  set yRangeLength(val) {
    this._updateRangeLength(val, this.range.y);
  }

  _calculateRangeLength(range) {
    return Math.abs(range.max - range.min);
  }
  _updateRangeLength(val, range) {
    let currRange = this._calculateRangeLength(range);
    if (val == currRange) {
      return;
    }
    let dx = val - currRange;
    range.min -= dx / 2;
    range.max += dx / 2;
    this._updateGraph();
  }

  setRangeX(min, max) {
    this.range.x.min = min;
    this.range.x.max = max;
    this._updateGraph(false);
  }
  setRangeY(min, max) {
    this.range.y.min = min;
    this.range.y.max = max;
    this._updateGraph(false);
  }
  setRangeZ(min, max) {
    this.range.z.min = min;
    this.range.z.max = max;
    this._updateGraph(false);
  }

  _updateGraph(transition) {
    try {
      if (this._errorText.visible) {
        this.showAxes = true;
        this._errorText.visible = false;
      }
      if (this._graph != undefined) {
        this._oldGraphPoints = JSON.parse(JSON.stringify(this._graph.points));
      }
      this._newGraph = new GraphPlotter3D(
        this._functionString,
        this.range,
        this._step
      );
    } catch (error) {
      console.warn("Error creating graph:", error.message);
      //alert("That isn't a valid function");
      this.showAxes = false;
      this._errorText.visible = true;
      return;
    }
    if (
      transition &&
      this._oldGraphPoints != undefined &&
      this._oldGraphPoints.length === this._graph.points.length &&
      this._graph.points.length === this._newGraph.points.length
    ) {
      this._transitioning = true;
    } else {
      this._graph = this._newGraph;
      this._updateSurfaceMesh();
    }
  }

  _transitionUpdater(oldGraphPoints, currentGraph, targetGraph, speed) {
    let notDone = true;
    const pointCount = currentGraph.points.length;
    for (let i = 0; i < pointCount; i++) {
      const oldZ = oldGraphPoints[i].z;
      const targetZ = targetGraph.points[i].z;
      const diff = targetZ - oldZ;
      const dz = diff * speed;
      // if (i === 0) {
      //   console.log(dz);
      //   console.log(oldZ, currentGraph.points[i].z);
      // }
      //console.log(oldZ, currentGraph[i])
      currentGraph.points[i].z += dz;
      if (
        i === pointCount - 1 &&
        Math.abs(currentGraph.points[i].z - targetZ) < Math.abs(diff) * 0.01
      ) {
        //console.log(currentGraph.points[i].z, oldZ, targetZ, diff, speed, dz);
        notDone = false;
      }
    }
    this._updateSurfaceMesh();
    return notDone;
  }

  _createGraphMesh(graph, color) {
    const geometry = new THREE.BufferGeometry();
    let vertices = [];
    let indices = [];
    for (let i = 0; i < graph.points.length; i++) {
      let p = graph.points[i];
      //if (!graph.pointExists(i)) p = { x: 0.0, y: 0.0, z: 0.0 };
      vertices.push(p.x, p.z, p.y);
    }
    for (let x = 0; x < graph.gridSize.x - 1; x++) {
      for (let y = 0; y < graph.gridSize.y - 1; y++) {
        let square = [
          graph.getGridIndex(x, y),
          graph.getGridIndex(x + 1, y),
          graph.getGridIndex(x + 1, y + 1),
          graph.getGridIndex(x, y + 1),
        ];
        // let checkExist = [
        // 	graph.pointExists(square[0]),
        // 	graph.pointExists(square[1]),
        // 	graph.pointExists(square[2]),
        // 	graph.pointExists(square[3]),
        // ];
        // let count = 0;
        // for (let i = 0; i < checkExist.length; i++) {
        // 	if (!checkExist[i]) count++;
        // }
        //if (count == 0) {
        indices.push(square[0], square[1], square[3]);
        indices.push(square[1], square[2], square[3]);
        //}
      }
    }
    let positionBuffer = new THREE.Float32BufferAttribute(vertices, 3);
    //let colorBuffer = new THREE.Float32BufferAttribute(colors, 3);
    geometry.setIndex(indices);
    geometry.setAttribute("position", positionBuffer);
    //geometry.setAttribute('color', colorBuffer);
    geometry.computeVertexNormals();
    const xRangeTotal = Math.abs(graph.range.x[1] - graph.range.x[0]);
    const yRangeTotal = Math.abs(graph.range.y[1] - graph.range.y[0]);
    // Center mesh
    geometry.translate(
      -1 * (graph.range.x[1] - xRangeTotal / 2),
      0,
      -1 * (graph.range.y[1] - yRangeTotal / 2)
    );
    let material = new THREE.MeshPhongMaterial({
      side: THREE.DoubleSide,
      color: color,
      //vertexColors: true,
      //wireframe: true,
    });
    //console.log(material);
    let mesh = new THREE.Mesh(geometry, material);
    return mesh;
  }

  _updateSurfaceMesh() {
    if (this.surfaceMesh != undefined) this._meshDispose(this.surfaceMesh);
    this.surfaceMesh = this._createGraphMesh(this._graph, this._graphColor);
    this.objectGroup.add(this.surfaceMesh);
  }

  _meshDispose(mesh) {
    mesh.geometry.dispose();
    mesh.material.dispose();
    this.objectGroup.remove(mesh);
  }

  setupPanControls(
    camera,
    domElement,
    speed,
    startCallback,
    moveCallback,
    endCallback
  ) {
    this.panControls = new GraphPanControls(
      camera,
      domElement,
      speed,
      () => {
        // START PAN
        startCallback();
      },
      (panVector) => {
        // PAN MOVE
        (this.range.x.min += panVector.x), (this.range.x.max += panVector.x);
        (this.range.y.min += panVector.y), (this.range.y.max += panVector.y);
        this._updateGraph();
        moveCallback();
      },
      () => {
        // PAN END
        this._updateGraph();
        endCallback();
      }
    );
  }

  setupGUI(gui, name) {
    // const keys = Object.keys(this.range.x);
    // console.log(keys)
    let graphControls = gui.addFolder(name);
    // console.log(this.heightFunction, this.showAxes);
    const updateFunc = this._updateGraph.bind(this);
    graphControls
      .add(this, "_functionString")
      .name("Function")
      .listen()
      .onFinishChange(updateFunc);
    //graphControls.add(this, 'heightFunction').listen()		// Instantly updates
    let xRangeFolder = graphControls.addFolder("X Range");
    xRangeFolder
      .add(this, "xRangeLength", 0, 200)
      .name("Length")
      .step(0.25)
      .listen();
    xRangeFolder
      .add(this.range.x, "min", -100, 100)
      .name("Min")
      .step(0.5)
      .listen()
      .onFinishChange(updateFunc);
    xRangeFolder
      .add(this.range.x, "max", -100, 100)
      .name("Max")
      .step(0.5)
      .listen()
      .onFinishChange(updateFunc);
    let yRangeFolder = graphControls.addFolder("Y Range");
    yRangeFolder
      .add(this, "yRangeLength", 0, 200)
      .name("Length")
      .step(0.25)
      .listen();
    yRangeFolder
      .add(this.range.y, "min", -100, 100)
      .name("Min")
      .step(0.5)
      .listen()
      .onFinishChange(updateFunc);
    yRangeFolder
      .add(this.range.y, "max", -100, 100)
      .name("Max")
      .step(0.5)
      .listen()
      .onFinishChange(updateFunc);
    graphControls
      .add(this, "step", 0.05, 2)
      .name("Step Size")
      .step(0.05)
      .listen(); // .onFinishChange(updateFunc);
    graphControls.add(this, "doTransition").name("Transition").listen();
    graphControls
      .add(this, "transitionSpeed", 0.5, 1.5)
      .name("Transition Speed")
      .step(0.01)
      .listen();
    graphControls.add(this, "showAxes").name("Show Axes").listen(); //.onFinishChange((val) => { axesHelper.material.visible = val; });
  }

  update(deltaTime) {
    this._errorText.update(deltaTime);
    if (this._transitioning) {
      this._transitioning = this._transitionUpdater(
        this._oldGraphPoints,
        this._graph,
        this._newGraph,
        this.transitionSpeed * deltaTime
      );
    }
  }
}

export { GraphObject };
