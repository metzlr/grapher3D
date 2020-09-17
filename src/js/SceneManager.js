import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { BiDirectionalLighting } from "./BiDirectionalLighting.js";
import { GraphObject } from "./GraphObject.js";
import { GUI } from "three/examples/jsm/libs/dat.gui.module";

class SceneManager {
  constructor(canvas) {
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      75,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      5000
    );
    this.camera.position.set(0, 0, 30);
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
    });

    this._clock = new THREE.Clock();
    this.deltaTime = undefined;

    this.controls = this._setupOrbitControls(this.camera, this.renderer);
    this.sceneObjects = this._createSceneObjects();
  }

  _createSceneObjects() {
    let lighting = new BiDirectionalLighting(this.scene);
    let graphObj = new GraphObject(this.scene);
    graphObj.heightFunction = "cos(x) + sin(y)";
    let gui = new GUI();
    graphObj.setupGUI(gui, "Graph Settings");
    graphObj.setupPanControls(
      this.camera,
      this.renderer.domElement,
      0.1,
      () => {
        this.controls.enabled = false;
      },
      () => {},
      () => {
        this.controls.enabled = true;
      }
    );
    return [lighting, graphObj];
  }

  _setupOrbitControls(camera, renderer) {
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.zoomSpeed = 0.25;
    controls.rotateSpeed = 0.5;
    controls.enableKeys = false;
    controls.enablePan = false;
    return controls;
  }

  update() {
    this.deltaTime = this._clock.getDelta(); // Get time since last frame

    if (this.resizeRendererToDisplaySize(this.renderer)) {
      const canvas = this.renderer.domElement;
      // console.log(canvas);
      this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
      this.camera.updateProjectionMatrix();
    }

    this.sceneObjects.forEach((item) => {
      item.update(this.deltaTime);
    });

    this.renderer.render(this.scene, this.camera);
  }

  resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const pixelRatio = window.devicePixelRatio;
    const width = (canvas.clientWidth * pixelRatio) | 0;
    const height = (canvas.clientHeight * pixelRatio) | 0;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }
}

export { SceneManager };
