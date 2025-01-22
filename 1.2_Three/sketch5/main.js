// Add this method to your AsciiScene class

addContourMap() {
    // Move camera to better view the flat contours
    this.camera.position.set(0, 4, 5);
    this.camera.lookAt(0, 0, 0);

    // Create a group to hold all contour lines
    this.objects.contours = new THREE.Group();

    // Create 5 concentric contour circles
    for (let radius = 0.5; radius <= 2.5; radius += 0.5) {
        // Create points for a circle
        const points = [];
        const segments = 32;
        for (let i = 0; i <= segments; i++) {
            const theta = (i / segments) * Math.PI * 2;
            points.push(new THREE.Vector3(
                Math.cos(theta) * radius,
                0,  // All points at y=0 to lie flat
                Math.sin(theta) * radius
            ));
        }

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ 
            color: 0xffffff,
            opacity: radius < 2.5 ? 0.5 : 1, // Make outer lines more visible
            transparent: true
        });

        const contourLine = new THREE.Line(geometry, material);
        this.objects.contours.add(contourLine);
    }

    this.scene.add(this.objects.contours);
}

// Modify the animate method to add gentle rotation
animate() {
    requestAnimationFrame(this.animate.bind(this));
    
    if (this.objects.contours) {
        this.objects.contours.rotation.y += 0.01;
    }
    
    this.effect.render(this.scene, this.camera);
}