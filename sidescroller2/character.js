class Character {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, 800 / 300, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('gameCanvas'),
            alpha: true
        });
        this.renderer.setSize(800, 300);
        
        // Character properties
        this.character = null;
        this.legs = [];
        this.animationFrame = 0;
        this.isJumping = false;
        this.velocityY = 0;
        
        this.init();
    }

    init() {
        // Create character body
        const bodyGeometry = new THREE.BoxGeometry(1, 1.5, 0.5);
        const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x2196F3 });
        this.character = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.scene.add(this.character);

        // Create legs
        const legGeometry = new THREE.BoxGeometry(0.2, 0.8, 0.2);
        const legMaterial = new THREE.MeshPhongMaterial({ color: 0x2196F3 });
        
        // Left leg
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.3, -1.15, 0);
        this.character.add(leftLeg);
        this.legs.push(leftLeg);

        // Right leg
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.3, -1.15, 0);
        this.character.add(rightLeg);
        this.legs.push(rightLeg);

        // Add lighting
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(5, 5, 5);
        this.scene.add(light);

        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);

        // Position camera
        this.camera.position.set(0, 0, 5);
        this.camera.lookAt(this.character.position);

        // Start animation
        this.animate();
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Update leg animation
        this.animationFrame += 0.1;
        const legRotation = Math.sin(this.animationFrame) * 0.5;
        
        this.legs[0].rotation.x = legRotation; // Left leg
        this.legs[1].rotation.x = -legRotation; // Right leg

        // Update jumping physics
        if (this.isJumping) {
            this.velocityY += 0.1; // Gravity
            this.character.position.y += this.velocityY;

            // Ground collision
            if (this.character.position.y <= 0) {
                this.character.position.y = 0;
                this.velocityY = 0;
                this.isJumping = false;
            }
        }

        this.renderer.render(this.scene, this.camera);
    }

    jump() {
        if (!this.isJumping) {
            this.isJumping = true;
            this.velocityY = -0.5;
        }
    }

    reset() {
        this.character.position.y = 0;
        this.velocityY = 0;
        this.isJumping = false;
    }
} 