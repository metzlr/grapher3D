import * as THREE from 'three'

class GraphPanControls {
  constructor(domElement, camera, panSpeed, onStartPan, onMovePan, onEndPan) {
    let _this = this;
    this.camera = camera;
    this.domElement = domElement;
    this.panSpeed = panSpeed;

    this.onStartPan = onStartPan;
    this.onMovePan = onMovePan;
    this.onEndPan = onEndPan;

    this.panning = false;
    this.panUpdateRate = 50;
    this.lastPanUpdateTime = undefined;
    this.lastX = undefined;
    this.lastY = undefined;
    //this.showDebugArrows = false;

    // let origin = new THREE.Vector3( 0, 10, 0 );
    // let length = 10;
    // let hex1 = 0xffff00;
    // let hex2 = 0xafdfa2;
    // arrowHelper1 = new THREE.ArrowHelper( new THREE.Vector3(0,0,0), origin, length, hex1 );
    // arrowHelper2 = new THREE.ArrowHelper( new THREE.Vector3(0,0,0), origin, length, hex2 );
    this.domElement.addEventListener('contextmenu', function(event) {
      event.preventDefault();
    });
    this.domElement.addEventListener('mousedown', function(event) {
      if (event.button == 2) { 
        // Prevent the browser from scrolling.
        event.preventDefault();
        // Manually set the focus since calling preventDefault above
        // prevents the browser from setting it automatically.
        _this.domElement.focus ? _this.domElement.focus() : window.focus();

        _this.panning = true; 
        _this.lastX = event.clientX;
        _this.lastY = event.clientY;
        _this.onStartPan();
      }
    });
    this.domElement.addEventListener('mousemove', function(event) {
      if (_this.panning) {
        if (_this.lastPanUpdateTime == undefined || event.timeStamp - _this.lastPanUpdateTime > _this.panUpdateRate) {
          event.preventDefault();
          _this.lastPanUpdateTime = event.timeStamp;
          let panVector = _this.pan(
            new THREE.Vector3(_this.lastX, _this.lastY),
            new THREE.Vector3(event.clientX, event.clientY),
            _this.panSpeed,
          );
          _this.onMovePan(panVector, event.shiftKey);
          _this.lastX = event.clientX;
          _this.lastY = event.clientY;
        }
      }
    });
    this.domElement.addEventListener('mouseup', function(event) {
      if (event.button == 2) { 
        _this.panning = false;
        _this.onEndPan();
      }
    });
  }

  pan(start, end, panSpeed) {
		// Get camera position in world space
		let eye = new THREE.Vector3();
		eye = this.camera.position.clone().normalize();
		// Calculate mouse movement vector in screen space
		let mouseChange = new THREE.Vector2().copy(end).sub(start);
		mouseChange.multiplyScalar(panSpeed * -1);
		if (this.camera.position.y < 0) { mouseChange.y *= -1; } // If below surface, Y movements are inverted
		// Get movement vector in world space by rotating it to line up with camera's Y-rotation
    let pan = new THREE.Vector2(mouseChange.x, mouseChange.y);
    //let pan2 = new THREE.Vector3(mouseChange.x, 0, mouseChange.y);
		let cameraPlanePos = new THREE.Vector2(eye.x, eye.z);
    let angle = cameraPlanePos.angle() - Math.PI/2;
    // if (showDebugArrows) {
    //   arrowHelper2.setDirection(pan.clone().normalize().negate());
    // }
    // console.log(pan);
    // console.log("PAN2", pan2);
    pan.rotateAround(new THREE.Vector2(0,0), angle);
    //pan2.applyAxisAngle(new THREE.Vector3(0,1,0), angle * -1);
    // console.log(pan);
    // console.log("AFTER PAN2", pan2);
    // if (showDebugArrows) {
    //   arrowHelper1.setDirection(pan.clone().normalize().negate());
    // }
		return pan;
	}
}

export { GraphPanControls }