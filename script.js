document.addEventListener('DOMContentLoaded', () => {
  // --- Smooth scroll for anchor links ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        
        document.querySelectorAll('.nav-links a').forEach(link => link.classList.remove('active'));
        this.classList.add('active');
      }
    });
  });

  // --- Intersection Observer for fade-in animations ---
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.head.insertAdjacentHTML('beforeend', `
    <style>
      .animate-on-scroll {
        opacity: 0;
        transform: translateY(40px) scale(0.95);
        transition: opacity 0.8s ease-out, transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      .animate-on-scroll.fade-in {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    </style>
  `);

  const animatedElements = document.querySelectorAll('.card-panel, .timeline-item, .section-title, .hero-content');
  animatedElements.forEach((el, index) => {
    el.classList.add('animate-on-scroll');
    // Add slight staggered delay
    el.style.transitionDelay = `${(index % 3) * 0.1}s`;
    observer.observe(el);
  });

  // --- Three.js Interactive Background ---
  initThreeJS();

});

function initThreeJS() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const scene = new THREE.Scene();
  
  // Camera
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 30;

  // Renderer
  const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  // Particles (Nodes)
  const particlesGeometry = new THREE.BufferGeometry();
  const particlesCount = 800;
  const layers = 10;
  const nodesPerLayer = Math.floor(particlesCount / layers);
  
  const posArray = new Float32Array(particlesCount * 3);
  
  // Generate nodes in distinct layers along the Z axis
  for(let i = 0; i < particlesCount; i++) {
    const layerIdx = Math.floor(i / nodesPerLayer);
    
    // Spread from Z = -100 to Z = 50
    const z = (layerIdx / layers) * 150 - 100;
    const x = (Math.random() - 0.5) * 80;
    const y = (Math.random() - 0.5) * 80;
    
    posArray[i*3] = x;
    posArray[i*3+1] = y;
    posArray[i*3+2] = z;
  }
  
  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
  
  const particlesMaterial = new THREE.PointsMaterial({
    size: 0.18,
    color: 0xffffff,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
  });
  
  const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
  scene.add(particlesMesh);

  // Lines (Connecting Nodes to form Neural Network Feedforward structure)
  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x2563eb,
    transparent: true,
    opacity: 0.20
  });

  const lineGeometry = new THREE.BufferGeometry();
  const linePositions = [];
  
  for (let i = 0; i < particlesCount; i++) {
    const layerIdx = Math.floor(i / nodesPerLayer);
    
    // Don't connect the last layer forward
    if (layerIdx >= layers - 1) continue;
    
    const x1 = posArray[i*3];
    const y1 = posArray[i*3+1];
    const z1 = posArray[i*3+2];
    
    // Connect to 2-3 random nodes in the NEXT layer
    const connections = 2 + Math.floor(Math.random() * 2);
    for (let c = 0; c < connections; c++) {
      const nextLayerStartIdx = (layerIdx + 1) * nodesPerLayer;
      const randomNodeInNextLayer = nextLayerStartIdx + Math.floor(Math.random() * nodesPerLayer);
      
      // Ensure we don't go out of bounds if array size is slightly off
      if (randomNodeInNextLayer >= particlesCount) continue;

      const x2 = posArray[randomNodeInNextLayer*3];
      const y2 = posArray[randomNodeInNextLayer*3+1];
      const z2 = posArray[randomNodeInNextLayer*3+2];
      
      // Only connect if distance on XY plane isn't too massive to keep it localized
      const dist = Math.sqrt(Math.pow(x2-x1, 2) + Math.pow(y2-y1, 2));
      if (dist < 40) {
        linePositions.push(x1, y1, z1);
        linePositions.push(x2, y2, z2);
      }
    }
  }

  lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
  const lineMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
  scene.add(lineMesh);

  // Mouse Interaction
  let mouseX = 0;
  let mouseY = 0;
  let targetX = 0;
  let targetY = 0;

  const windowHalfX = window.innerWidth / 2;
  const windowHalfY = window.innerHeight / 2;

  document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX - windowHalfX);
    mouseY = (event.clientY - windowHalfY);
  });

  // Scroll interaction for 3D Camera
  let scrollY = 0;
  window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
  });

  // Animation Loop
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    
    const elapsedTime = clock.getElapsedTime();

    targetX = mouseX * 0.001;
    targetY = mouseY * 0.001;

    // Smooth camera movement (mouse + scroll fly-through)
    // Base Z is 30. Scroll moves camera forward through the points.
    const targetZ = 30 - (scrollY * 0.02);
    
    camera.position.x += (mouseX * 0.01 - camera.position.x) * 0.05;
    camera.position.y += (-mouseY * 0.01 - camera.position.y) * 0.05;
    camera.position.z += (targetZ - camera.position.z) * 0.05;
    
    camera.lookAt(scene.position);

    // Rotate meshes
    particlesMesh.rotation.y += 0.001;
    particlesMesh.rotation.x += 0.0005;
    
    lineMesh.rotation.y += 0.001;
    lineMesh.rotation.x += 0.0005;

    // Slight pulse effect on particles
    particlesMaterial.size = 0.15 + Math.sin(elapsedTime * 2) * 0.05;

    renderer.render(scene, camera);
  }

  animate();

  // Resize handler
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}
