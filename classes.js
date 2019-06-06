class World {
    constructor(name = "", gravity = 9.81) {
        this.name = name;
        this.gravity = gravity;

        worldGravity = this.gravity;
        this.reset();
    }

    update() {
        this.gravity = worldGravity;
        
        for (const i in this.entities) {
            this.entities[i].update();            
        }

        for (const i in this.entities) {
            this.entities[i].draw();      
        }

        this.updateCollision();
    }

    reset() {
        this.entities = [];
        this.planet = new Planet(this, this.name, earthTexture, createVector(0, height));
        this.rocket = new Rocket(this, "Starship", starshipImage, createVector(width / 2, 0));
        this.entities.push(this.planet);
        this.entities.push(this.rocket);
    }

    updateCollision() {
        for (const i in this.rocket.collisionPoints) {
            const col = this.testCollision(this.rocket.getCollisionPoint(i));

            if(!col) return;

            const r2d = 180 / Math.PI; //Radians to degrees
            const surfaceAngle = col.normal.heading() - Math.PI / 2;
            const rocketAngle = this.rocket.angle;
            const angle = rocketAngle - surfaceAngle;
            const speed = this.rocket.velocity.mag();
            const canLand = Math.abs(rocketAngle * r2d) < maxLandingAngle && Math.abs(angle * r2d) < maxLandingDelta && speed < maxLandingSpeed;

            if (col.distance < 0) {
                const offset = p5.Vector.mult(col.normal, col.distance); // How far down in the ground
                this.rocket.position.add(offset); // Move back to surface
                this.rocket.velocity.mult(0);

                if (canLand) {
                    alert("Nice landing!");
                }
                else {
                    alert("You crashed!");
                }

                this.reset();
            }

            if (window.debug) {
                if (canLand) stroke('rgb(0, 255, 255)');
                else stroke('rgb(255, 0, 0)');
                line(col.midPoint.x, col.midPoint.y, col.midPoint.x - col.normal.x * 20, col.midPoint.y - col.normal.y * 20);
            }
        }
    }

    testCollision(point) {
        const heightmap = this.planet.heightmap;
        const x1 = Math.round(point.x);
        const x2 = Math.round(point.x + 1);
        const y1 = heightmap[x1];
        const y2 = heightmap[x2];

        if (y1 && y2) {
            const p1 = createVector(x1, y1);
            const p2 = createVector(x2, y2);

            const distance = distToSegmentSigned(point, p1, p2);
            const normal = createVector(y1 - y2, x2 - x1); // Rotate vector 90 degrees
            normal.normalize();

            return {
                distance: distance,
                normal: normal,
                point1: p1,
                point2: p2,
                midPoint: p5.Vector.add(p1, p2).mult(0.5)
            };
        }
    }
}

class Entity {
    constructor(world, name, image, position) {
        this.world = world;
        this.name = name;
        this.image = image;
        this.position = position;
        this.width = this.image.width;
        this.height = this.image.height
    }

    update() { }

    draw() {
        if (this.image)
            image(this.image, this.position.x, this.position.y)
    }
}

class Planet extends Entity {
    constructor(world, name, image, position) {
        super(world, name, image, position)

        this.generateHeightmap();
    }

    draw() {
        fill('rgb(96, 128, 56)');
        stroke('black')
        beginShape();
        vertex(-100, height);
        for (let i = 0; i < width; i++) {
            vertex(i, this.heightmap[i]);
        }

        vertex(width + 100, height);
        endShape();
    }

    generateHeightmap() {
        this.heightmap = []
        for (let i = 0; i < width; i++) {
            this.heightmap.push(noise(i / (1000 * terrainSmoothing)) * height / 2);
        }

        let minValue = Math.min.apply(Math, this.heightmap);
        for (const i in this.heightmap) {
            this.heightmap[i] = minValue + height - this.heightmap[i];
        }
    }
}

class RigidBody extends Entity {
    constructor(world, name, image, position, mass = 1000) {
        super(world, name, image, position);

        this.mass = mass;

        // Defaults
        this.angularAcceleration = 1;
        this.maxAngularVelocity = 2;
        this.force = createVector(0, 0);
        this.pendingForce = createVector(0, 0);
        this.acceleration = createVector(0, 0);
        this.velocity = createVector(0, 0);
        this.centerOfMass = createVector(this.image.width / 2, this.image.height / 2);
        this.angle = 0;
        this.angularAcceleration = 0;
        this.angularVelocity = 0;
        this.collisionPoints = [
            [0, -1],
            [-0.5, -0.6],
            [0.5, -0.6],
            [0, 0.83],
            [-1, 1],
            [1, 1]
        ]
    }

    update() {
        if (this.position.x + this.width / 2 < 0 || this.position.x - this.width / 2 > width)
            this.world.reset();

        let dt = getDeltaTime();

        this.force = this.pendingForce;
        this.force.y += this.world.gravity * this.mass;
        this.acceleration = p5.Vector.div(this.force, this.mass);
        this.pendingForce = createVector(0, 0);
        this.velocity.add(p5.Vector.mult(this.acceleration, dt));
        this.position.add(p5.Vector.mult(this.velocity, dt * 10));
        this.angularVelocity += this.angularAcceleration * dt;
        this.angle += this.angularVelocity * dt;

        this.angularAcceleration = 0;
        this.angularVelocity *= 0.99; // Air friction
    }

    draw() {
        if (this.image) {
            const w2 = this.width / 2;
            const h2 = this.height / 2;
            push()
            translate(this.position.x + w2, this.position.y + h2);
            rotate(this.angle);
            imageMode(CENTER);
            image(this.image, 0, 0, this.width, this.height)
            pop()
        }

        if (window.debug) {
            strokeWeight(5);
            for (let i in this.collisionPoints) {
                const pointPosition = this.getCollisionPoint(i);
                point(pointPosition.x, pointPosition.y);
            }
        }
    }

    getCollisionPoint(index) {
        const w2 = this.width / 2;
        const h2 = this.height / 2;
        let x = this.collisionPoints[index][0] * w2;
        let y = this.collisionPoints[index][1] * h2;

        const cosA = Math.cos(this.angle);
        const sinA = Math.sin(this.angle);

        const xr = x * cosA - y * sinA;
        const yr = y * cosA + x * sinA;

        return createVector(this.position.x + xr + w2, this.position.y + yr + h2);
    }

    addForce(force) {
        this.pendingForce = force;
    }
}

class Rocket extends RigidBody {
    constructor(world, name, image, position) {
        super(world, name, image, position);

        // Defaults
        this.thrustParticles = new ParticleSystem(this.getCollisionPoint(3));
        this.rightGasParticles = new ParticleSystem(this.getCollisionPoint(3));
        this.leftGasParticles = new ParticleSystem(this.getCollisionPoint(3));
    }

    update() {
        const altitude = Math.round(abs(this.position.y + this.height - height));
        const velocity = Math.round(p5.Vector.mag(this.velocity));
        const acceleration = Math.round(p5.Vector.mag(this.acceleration) * 100) / 100 * Math.sign(-this.acceleration.y);
        const angularVelocity = Math.round(this.angularVelocity * 10) / 10;

        fill(0);
        strokeWeight(0);

        const topOffset = 300;

        text(`Altitude: ${altitude} m`, 20, topOffset);
        text(`Velocity: ${velocity} m/s`, 20, topOffset + fontSize);
        text(`Acceleration: ${acceleration} m/s\u00B2`, 20, topOffset + fontSize * 2);
        text(`Angular velocity: ${angularVelocity} rad/s`, 20, topOffset + fontSize * 3);

        const yTranslation = -this.position.y + this.height;
        if (this.position.y < this.height)
            translate(0, yTranslation);


        this.mass = rocketMass;
        this.thrustForce = thrustForce;

        // Space bar pressed
        if (keyIsDown(32)) {
            this.fireThruster();
        }

        // A pressed
        if (keyIsDown(65)) {
            this.rightControlThruster();
        }

        // D pressed
        if (keyIsDown(68)) {
            this.leftControlThruster();
        }

        // X pressed
        if (keyIsDown(88)) {
            this.world.reset();
        }

        this.thrustParticles.run();
        this.rightGasParticles.run();
        this.leftGasParticles.run();

        super.update();
    }

    // Fire main engine
    fireThruster() {
        const xComp = Math.sin(this.angle);
        const yComp = -Math.cos(this.angle);

        const direction = createVector(xComp, yComp);
        const directionalForceVector = createVector(direction.x * this.thrustForce, direction.y * this.thrustForce)
        this.addForce(directionalForceVector);

        /* Engine flame particles */

        const fromColor = color(122, 134, 255);
        const toColor = color(252, 164, 76);

        const particleAccelerationVector = p5.Vector.div(directionalForceVector, -1000000)

        this.thrustParticles.origin = this.getCollisionPoint(3);
        this.thrustParticles.addParticle(particleAccelerationVector, fromColor, toColor, 1.5);
        this.thrustParticles.addParticle(particleAccelerationVector, fromColor, toColor, 1.5);
        this.thrustParticles.addParticle(particleAccelerationVector, fromColor, toColor, 1.5);
    }

    // Fire right control thruster
    rightControlThruster() {
        this.angularAcceleration -= 0.5;
        const gasAcceleration = -this.angularAcceleration * 5;

        const xComp = Math.cos(this.angle);
        const yComp = Math.sin(this.angle);

        const direction = createVector(xComp, yComp);
        const particleAccelerationVector = createVector(direction.x * gasAcceleration, direction.y * gasAcceleration)

        /* Gas thruster particles */

        const fromColor = color(255, 255, 255);
        const toColor = color(255, 255, 255, 0);

        this.rightGasParticles.origin = this.getCollisionPoint(2);
        this.rightGasParticles.addParticle(particleAccelerationVector, fromColor, toColor, 0.75);
    }

    // Fire left control thruster
    leftControlThruster() {
        this.angularAcceleration += 0.5;
        const gasAcceleration = -this.angularAcceleration * 5;

        const xComp = Math.cos(this.angle);
        const yComp = Math.sin(this.angle);

        const direction = createVector(xComp, yComp);
        const particleAccelerationVector = createVector(direction.x * gasAcceleration, direction.y * gasAcceleration)

        /* Gas thruster particles */

        const fromColor = color(255, 255, 255);
        const toColor = color(255, 255, 255, 0);

        this.rightGasParticles.origin = this.getCollisionPoint(1);
        this.rightGasParticles.addParticle(particleAccelerationVector, fromColor, toColor, 0.75);
    }
}

class Particle {
    constructor(position, acceleration, fromColor, toColor, lifespan) {
        this.acceleration = createVector(acceleration.x, acceleration.y);
        this.velocity = createVector(random(-1, 1), random(-1, 0));
        this.position = position.copy();
        this.fromColor = fromColor;
        this.toColor = toColor;
        this.lifespan = lifespan;
    }

    run() {
        this.update();
        this.draw();
    }

    // Update position
    update() {
        this.velocity.add(this.acceleration);
        this.position.add(this.velocity);
        this.lifespan -= 8 * getDeltaTime();
    }

    // Show particle with changing color
    draw() {
        let progression = 1 - this.lifespan;
        if (this.lifespan < 0.1)
            this.fromColor = color(216, 210, 207, 255);
        this.toColor = color(216, 210, 207, 100);
        let lColor = lerpColor(this.fromColor, this.toColor, progression);
        stroke(200, this.lifespan * 10);
        fill(lColor);
        ellipse(this.position.x, this.position.y, 8, 8);
    }

    // Check if particle is too old
    isDead() {
        return this.lifespan < 0;
    }
}

class ParticleSystem {
    constructor(position) {
        this.origin = position.copy();
        this.particles = [];
    }

    // Remove old particles
    run() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];

            p.run();
            if (p.isDead()) {
                this.particles.splice(i, 1);
            }
        }
    }

    // Spawn particle
    addParticle(acceleration, fromColor, toColor, lifespan) {
        this.particles.push(new Particle(this.origin, acceleration, fromColor, toColor, lifespan));
    }
}