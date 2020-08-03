import { SceneManager } from './SceneManager.js'
import Stats from 'three/examples/jsm/libs/stats.module'

(function() {
  const canvas = document.getElementById('canvas');
  const sceneManager = new SceneManager(canvas);
  const stats = setupStatDisplay();
  document.body.appendChild(stats.dom);

  renderScene();

  function renderScene() {
    requestAnimationFrame(renderScene);
    sceneManager.update();
    stats.update();
  }

  function setupStatDisplay() {
    let stats = new Stats();
		stats.showPanel(1); // 0: fps, 1: ms, 2: mb, 3+: custom
		stats.showPanel(0);
		//stats.showPanel(2);
		return stats
  }

})();
