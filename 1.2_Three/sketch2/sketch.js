//
// sketch.js
//
(function () {
  THREE_SETUP.initThreeBase();

  const scene = THREE_SETUP.getScene();
  const camera = THREE_SETUP.getCamera();
  const renderer = THREE_SETUP.getRenderer();
  const controls = THREE_SETUP.getControls();

  camera.position.set(0, 80, 160);

  const size = 200;
  const divisions = 50;
  const planeGeometry = new THREE.PlaneBufferGeometry(size, size, divisions, divisions);
  planeGeometry.rotateX(-Math.PI / 2);

  const positionArray = planeGeometry.attributes.position.array;
  const originalPositions = new Float32Array(positionArray.length);
  for (let i = 0; i < positionArray.length; i++) {
    originalPositions[i] = positionArray[i];
  }

  const wireframeMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    wireframe: true
  });

  const terrainMesh = new THREE.Mesh(planeGeometry, wireframeMaterial);
  scene.add(terrainMesh);

  // Changed here: "new ImprovedNoise()" instead of "new THREE.ImprovedNoise()"
  const noise = new ImprovedNoise();

  let time = 0;
  const speed = 0.5;
  const frequency = 0.03;
  const amplitude = 8;

  function animate() {
    requestAnimationFrame(animate);

    time += speed * 0.01;

    for (let i = 0; i < positionArray.length; i += 3) {
      const ox = originalPositions[i];
      const oy = originalPositions[i + 1];
      const oz = originalPositions[i + 2];

      const nx = ox * frequency;
      const nz = oz * frequency;
      const val = noise.noise(nx, time, nz);

      positionArray[i + 1] = oy + val * amplitude;
    }

    planeGeometry.attributes.position.needsUpdate = true;
    planeGeometry.computeVertexNormals();

    controls.update();
    renderer.render(scene, camera);
  }

  animate();
})();
