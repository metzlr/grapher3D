import { SceneManager } from "./SceneManager.js";
import Stats from "three/examples/jsm/libs/stats.module";

(function () {
  const canvas = document.getElementById("canvas");
  const sceneManager = new SceneManager(canvas);
  const stats = undefined; //setupStatDisplay();
  if (stats != undefined) {
    document.body.appendChild(stats.dom);
  }

  renderScene();
  setupHelpModal();

  function setupHelpModal() {
    const modal = document.getElementById("help-modal");
    const btn = document.getElementById("help-button");
    const closeSpan = modal.querySelector(".modal-close");
    btn.onclick = () => {
      modal.style.display = "block";
    };

    closeSpan.onclick = () => {
      modal.style.display = "none";
    };

    window.onclick = function (event) {
      if (event.target == modal) {
        modal.style.display = "none";
      }
    };
  }

  function renderScene() {
    requestAnimationFrame(renderScene);
    sceneManager.update();
    if (stats != undefined) {
      stats.update();
    }
  }

  function setupStatDisplay() {
    let stats = new Stats();
    stats.showPanel(1); // 0: fps, 1: ms, 2: mb, 3+: custom
    stats.showPanel(0);
    //stats.showPanel(2);
    return stats;
  }
})();
