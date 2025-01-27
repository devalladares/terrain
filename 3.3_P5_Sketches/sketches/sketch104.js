export default function(p) {
    const CONFIG = {
      terrain: {
        resolution: 80,
        spacing: 12,
        noiseScale: 0.15,
        waveSpeed: 0.007,
        amplitude: 140,
        ribbonCount: 5
      },
      color: {
        bg: [252, 246, 237], // Warm parchment
        terrainLow: [255, 237, 214], // Soft peach
        terrainHigh: [222, 165, 132], // Terracotta
        accent: [195, 89, 73] // Warm crimson
      },
      camera: {
        radius: 800,
        rotationSpeed: 0.0008,
        minPhi: Math.PI/5,
        maxPhi: Math.PI/2.2
      }
    };
  
    let terrain = [];
    let rotation = { theta: 0, phi: Math.PI/3 };
    let ribbons = [];
    let lastMouse = { x: 0, y: 0 };
  
    class Ribbon {
      constructor() {
        this.path = [];
        this.hue = p.random(30, 50);
        this.sat = p.random(60, 80);
        this.light = p.random(60, 80);
      }
  
      update() {
        // Create organic ribbon paths that follow terrain contours
        if (this.path.length < 1) this.spawn();
        
        let current = this.path[this.path.length-1];
        let next = this.findNextPoint(current);
        
        if (next) this.path.push(next);
        else this.path.shift();
        
        if (this.path.length > 20) this.path.shift();
      }
  
      spawn() {
        let x = p.floor(p.random(CONFIG.terrain.resolution));
        let y = p.floor(p.random(CONFIG.terrain.resolution));
        this.path.push({x, y});
      }
  
      findNextPoint(pos) {
        // Biologically-inspired movement patterns
        let neighbors = [
          {x: pos.x+1, y: pos.y, dir: 0},
          {x: pos.x, y: pos.y+1, dir: Math.PI/2},
          {x: pos.x-1, y: pos.y, dir: Math.PI},
          {x: pos.x, y: pos.y-1, dir: -Math.PI/2}
        ];
        
        return neighbors.reduce((acc, n) => {
          if (!this.valid(n)) return acc;
          let currentHeight = terrain[pos.x][pos.y];
          let neighborHeight = terrain[n.x][n.y];
          let slope = Math.abs(currentHeight - neighborHeight);
          let score = p.noise(n.x*0.1, n.y*0.1) * (1 - slope/50);
          return score > (acc?.score || 0) ? {x: n.x, y: n.y, score} : acc;
        }, null);
      }
  
      valid(pos) {
        return pos.x >= 0 && pos.x < CONFIG.terrain.resolution &&
               pos.y >= 0 && pos.y < CONFIG.terrain.resolution;
      }
  
      draw() {
        p.stroke(this.hue, this.sat, this.light, 80);
        p.noFill();
        p.beginShape();
        this.path.forEach((pt, i) => {
          let z = terrain[pt.x][pt.y];
          let x = pt.x * CONFIG.terrain.spacing - CONFIG.terrain.resolution * CONFIG.terrain.spacing/2;
          let y = z * 0.8;
          let zPos = pt.y * CONFIG.terrain.spacing - CONFIG.terrain.resolution * CONFIG.terrain.spacing/2;
          p.curveVertex(x, y, zPos);
        });
        p.endShape();
      }
    }
  
    p.setup = function() {
      p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);
      p.colorMode(p.HSL);
      p.perspective(Math.PI/3, p.width/p.height, 1, 5000);
      
      // Initialize terrain
      for(let i = 0; i < CONFIG.terrain.resolution; i++) {
        terrain[i] = [];
        for(let j = 0; j < CONFIG.terrain.resolution; j++) {
          terrain[i][j] = 0;
        }
      }
  
      // Create flowing ribbons
      for(let i = 0; i < CONFIG.terrain.ribbonCount; i++) {
        ribbons.push(new Ribbon());
      }
    };
  
    p.draw = function() {
      p.background(CONFIG.color.bg);
      updateTerrain();
      updateCamera();
      
      p.push();
      p.rotateY(rotation.theta);
      p.rotateX(rotation.phi);
      
      // Draw organic base terrain
      drawWovenTerrain();
      
      // Draw flowing ribbons
      ribbons.forEach(r => {
        r.update();
        r.draw();
      });
      
      p.pop();
    };
  
    function updateTerrain() {
      let t = p.frameCount * CONFIG.terrain.waveSpeed;
      for(let i = 0; i < CONFIG.terrain.resolution; i++) {
        for(let j = 0; j < CONFIG.terrain.resolution; j++) {
          let noiseVal = p.noise(
            i * CONFIG.terrain.noiseScale,
            j * CONFIG.terrain.noiseScale,
            t
          );
          terrain[i][j] = p.map(noiseVal, 0, 1, -CONFIG.terrain.amplitude, CONFIG.terrain.amplitude);
        }
      }
    }
  
    function drawWovenTerrain() {
      p.strokeWeight(0.8);
      
      // Horizontal waves
      drawDirectionalLines(true);
      
      // Vertical waves
      drawDirectionalLines(false);
      
      // Diagonal waves
      drawDiagonalWeave();
    }
  
    function drawDirectionalLines(horizontal) {
      for(let i = 0; i < CONFIG.terrain.resolution; i++) {
        p.beginShape();
        for(let j = 0; j < CONFIG.terrain.resolution; j++) {
          let x = (horizontal ? j : i) * CONFIG.terrain.spacing;
          let z = (horizontal ? i : j) * CONFIG.terrain.spacing;
          let y = terrain[horizontal ? j : i][horizontal ? i : j];
          
          x -= CONFIG.terrain.resolution * CONFIG.terrain.spacing/2;
          z -= CONFIG.terrain.resolution * CONFIG.terrain.spacing/2;
          
          let elevation = p.map(y, -CONFIG.terrain.amplitude, CONFIG.terrain.amplitude, 0, 1);
          p.stroke(
            p.lerpColor(p.color(...CONFIG.color.terrainLow), p.color(...CONFIG.color.terrainHigh), elevation)
          );
          p.vertex(x, y, z);
        }
        p.endShape();
      }
    }
  
    function drawDiagonalWeave() {
      p.stroke(...CONFIG.color.accent, 50);
      for(let k = 0; k < CONFIG.terrain.resolution * 2; k++) {
        p.beginShape();
        for(let j = 0; j <= k; j++) {
          let i = k - j;
          if(i < CONFIG.terrain.resolution && j < CONFIG.terrain.resolution) {
            let x = i * CONFIG.terrain.spacing - CONFIG.terrain.resolution * CONFIG.terrain.spacing/2;
            let z = j * CONFIG.terrain.spacing - CONFIG.terrain.resolution * CONFIG.terrain.spacing/2;
            p.vertex(x, terrain[i][j], z);
          }
        }
        p.endShape();
      }
    }
  
    function updateCamera() {
      if(p.mouseIsPressed) {
        rotation.theta += (p.mouseX - lastMouse.x) * 0.005;
        rotation.phi = p.constrain(
          rotation.phi + (lastMouse.y - p.mouseY) * 0.005,
          CONFIG.camera.minPhi,
          CONFIG.camera.maxPhi
        );
      } else {
        rotation.theta += CONFIG.camera.rotationSpeed;
      }
      lastMouse.x = p.mouseX;
      lastMouse.y = p.mouseY;
    }
  
    p.windowResized = function() {
      p.resizeCanvas(p.windowWidth, p.windowHeight);
      p.perspective(Math.PI/3, p.width/p.height, 1, 5000);
    };
  }