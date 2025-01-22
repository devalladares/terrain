//
// main.js
//
(function () {
    // Global references (if you prefer, you can store in an object):
    let scene, camera, renderer, controls;
  
    function initThreeBase() {
      // Scene
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x333333);
  
      // Renderer
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      document.body.appendChild(renderer.domElement);
  
      // Camera
      camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        1,
        1000
      );
      camera.position.set(0, 100, 200);
  
      // OrbitControls
      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.minDistance = 50;
      controls.maxDistance = 600;
      controls.maxPolarAngle = Math.PI / 2;
  
      // Lights
      const ambientLight = new THREE.AmbientLight(0x404040);
      scene.add(ambientLight);
  
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(1, 1, 1).normalize();
      scene.add(directionalLight);
  
      // Event listener for resizing
      window.addEventListener("resize", onWindowResize, false);
  
      function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }
    }
  
    // We export an object with references + an “init” method:
    window.THREE_SETUP = {
      initThreeBase: initThreeBase,
      getScene: () => scene,
      getCamera: () => camera,
      getRenderer: () => renderer,
      getControls: () => controls,
    };
  })();
  