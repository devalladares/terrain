//
// sketch1.js
//
(function () {
    // 1. Initialize the shared base
    THREE_SETUP.initThreeBase();
    
    // 2. Get references to scene, camera, etc.
    const scene = THREE_SETUP.getScene();
    const camera = THREE_SETUP.getCamera();
    const renderer = THREE_SETUP.getRenderer();
    const controls = THREE_SETUP.getControls();
  
    // Optionally add helpers
    const gridHelper = new THREE.GridHelper(1000, 50, 0x888888, 0x444444);
    scene.add(gridHelper);
  
    const axesHelper = new THREE.AxesHelper(100);
    scene.add(axesHelper);
  
    // 3. Create your geometry & mesh
    //    (This is the "terrain" part, same code as you had)
    const planeGeometry = new THREE.PlaneBufferGeometry(400, 400, 100, 100);
    planeGeometry.rotateX(-Math.PI / 2);
  
    // For example, do some displacement
    const positions = planeGeometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      // positions[i], positions[i+1], positions[i+2]
      // do your height manipulations, e.g.:
      // positions[i + 1] = Math.random() * 10; // random "hill"
    }
    planeGeometry.attributes.position.needsUpdate = true;
    planeGeometry.computeVertexNormals();
  
    const planeMaterial = new THREE.MeshPhongMaterial({
      color: 0x226622,
      shininess: 10,
      flatShading: false
    });
  
    const terrain = new THREE.Mesh(planeGeometry, planeMaterial);
    scene.add(terrain);
  
    // 4. Animate
    function animate() {
      requestAnimationFrame(animate);
  
      // If you want real-time wave or movement:
      // update plane geometry here each frame
  
      controls.update();
      renderer.render(scene, camera);
    }
  
    animate();
  })();
  