import * as THREE from "three";
import helvetiker_regular from "three/examples/fonts/helvetiker_regular.typeface.json";

class TextObject {
  constructor(scene, text) {
    this.scene = scene;
    this._text = text || "Text";
    this.font = new THREE.Font(helvetiker_regular);
    this.geometry = new THREE.TextGeometry(this._text, {
      font: this.font,
      size: 10,
      height: 1,
      curveSegments: 7,
      // bevelEnabled: true,
      // bevelThickness: 1,
      // bevelSize: 0.15,
      // bevelOffset: 0,
      // bevelSegments: 3,
    });
    this.geometry.center();
    this.material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.name = "textMesh";
    this.mesh.position.set(0, 0, 0);

    this.rotationSpeed = 0.6;
    this.scene.add(this.mesh);
  }

  get visible() {
    return this.material.visible;
  }
  set visible(val) {
    this.material.visible = val;
  }
  get text() {
    return this._text;
  }
  set text(val) {
    this.geometry.text = val;
    this._text = val;
    console.log(this.geometry.text, val);
  }

  update(deltaTime) {
    this.mesh.rotateY(this.rotationSpeed * deltaTime);
  }
}

export { TextObject };
