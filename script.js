const INITIAL_VELOCITY = 0.025;
const GRAVITY = 0.0002;

import { Point, Rectangle, Quadtree } from './quadtree.js';

class Ball {
    constructor(ballElem) {
        this.ballElem = ballElem
        this.reset()
    }

    get x() {
        return parseFloat(getComputedStyle(this.ballElem).getPropertyValue("--x"))
    }

    set x(value) {
        this.ballElem.style.setProperty("--x", value)
    }


    get y() {
        return parseFloat(getComputedStyle(this.ballElem).getPropertyValue("--y"))
    }

    set y(value) {
        this.ballElem.style.setProperty("--y", value)
    }

    get angle() {
        return parseFloat(getComputedStyle(this.ballElem).getPropertyValue("--angle"))
    }

    set angle(value) {
        this.ballElem.style.setProperty("--angle", value)
    }

    get size() {
        return parseFloat(getComputedStyle(this.ballElem).getPropertyValue("--size"))
    }

    set size(value) {
        this.ballElem.style.setProperty("--size", value)    
    }

    rect() {
        return this.ballElem.getBoundingClientRect()
    }

    reset() {
        this.x = 50
        this.y = 50
        this.direction = {x: 0}
        while(Math.abs(this.direction.x) <= 0.2 || Math.abs(this.direction.x) >= 0.9) {
            this.heading = getRandomNumberBetween(0, 2 * Math.PI)
            this.direction = {x: Math.cos(this.heading), y: Math.sin(this.heading)}
        }
        this.velocity = INITIAL_VELOCITY
        this.movementSpeed = 1
    }

    isCollision(other) {
        const radiusA = this.rect().width / 2.0
        const radiusB = other.rect().width / 2.0
        // (x, y) center point
        const x1 = this.rect().right - radiusA 
        const y1 = this.rect().bottom - radiusA
        const x2 = other.rect().right - radiusB
        const y2 = other.rect().bottom - radiusB
        // Distance formula
        const distanceBtwBalls = Math.sqrt(Math.pow((x2 - x1), 2) + Math.pow((y2 - y1), 2))
        return distanceBtwBalls < radiusA + radiusB
    }

    resolveOverlap(other) {
        const r1 = this.rect().width / 2;
        const r2 = other.rect().width / 2;

        const x1 = this.rect().left + r1;
        const y1 = this.rect().top + r1;
        const x2 = other.rect().left + r2;
        const y2 = other.rect().top + r2;

        const dx = x2 - x1;
        const dy = y2 - y1;
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance === 0) distance = 0.1; // prevent NaN

        const overlap = r1 + r2 - distance;

        if (overlap > 0) {
            const moveX = (dx / distance) * (overlap / 2);
            const moveY = (dy / distance) * (overlap / 2);

            const offsetX = convertPxToPercent(moveX, window.innerWidth);
            const offsetY = convertPxToPercent(moveY, window.innerHeight);

            this.x -= offsetX;
            this.y -= offsetY;
            other.x += offsetX;
            other.y += offsetY;
        }
    }

    elasticCollisionHandle(other) {
        // When both masses are equal
        let tempA = {v: this.velocity, d: this.direction}
        if(this.size === other.size) {
            this.velocity = other.velocity
            this.direction = other.direction
            other.velocity = tempA.v
            other.direction = tempA.d
        } else {
            // Formula: v1' = v1 - m2 / m1 + m2 * (v1Vec - v2Vec).(r1Vec - r2Vec) / (r1 - r1)*(r1 - r1)
            let v1 = this.velocity
            let d1 = this.direction
            let m1 = this.size 
            let r1 = {x: this.x, y: this.y}

            let v2 = other.velocity
            let d2 = other.direction
            let m2 = other.size 
            let r2 = {x: other.x, y: other.y}

            let v1Vec = {x: v1 * d1.x, y: v1 * d1.y}
            let v2Vec = {x: v2 * d2.x, y: v2 * d2.y}

            // x and y components
            // r1 - r2 = r1.x - r2.x, r1.y - r2.y
            let dx = r1.x - r2.x
            let dy = r1.y - r2.y
            let distSq = dx * dx + dy * dy
            if(Math.sqrt(distSq) === 0) distSq = 0.1

            let dvx = v1Vec.x - v2Vec.x;
            let dvy = v1Vec.y - v2Vec.y;
            // dot product = (dvx + dvy).(dx + dy) = dvx * dx + dvy * dy
            let dot = dvx * dx + dvy * dy

            let factor1 = (2 * m2) / (m1 + m2) * (dot / distSq);
            let factor2 = (2 * m1) / (m1 + m2) * (-dot / distSq);

            let v1Prime = { x: v1Vec.x - factor1 * dx, y: v1Vec.y - factor1 * dy }
            let v2Prime = { x: v2Vec.x - factor2 * dx, y: v2Vec.y - factor2 * dy }

            // Math.hypot computes magnitude of velocity
            this.velocity = Math.hypot(v1Prime.x, v1Prime.y)
            this.direction = {x: v1Prime.x / this.velocity, y: v1Prime.y / this.velocity}
            
            other.velocity = Math.hypot(v2Prime.x, v2Prime.y)
            other.direction = {x: v2Prime.x / other.velocity, y: v2Prime.y / other.velocity}
        }
    }
    
    wallCollision() {
        const radius = this.rect().width / 2;
        const rect = this.rect()

        // Collision detection for walls
        // TOP & BOTTOM
        if(rect.bottom >= window.innerHeight) {
            this.y = convertPxToPercent((window.innerHeight - radius), window.innerHeight) 
            this.direction.y *= -1
        } else if (rect.top <= 0) {
            this.y = convertPxToPercent(radius, window.innerHeight)
            this.direction.y *= -1
        }
        
        // LEFT & RIGHT
        if(rect.right >= window.innerWidth) {
            this.x = convertPxToPercent((window.innerWidth - radius), window.innerWidth);
            this.direction.x *= -1
        } else if (rect.left <= 0) {
            this.x = convertPxToPercent(radius, window.innerWidth)
            this.direction.x *= -1
        }
    }

    ballCollision(balls) {
        const boundary = new Rectangle(window.innerWidth / 2, window.innerHeight / 2, window.innerWidth, window.innerHeight);
        const qtree = new Quadtree(boundary, 4);

        // Insert all balls into the quadtree
        for (const ball of balls) {
            const r = ball.rect();
            const centerX = r.left + r.width / 2;
            const centerY = r.top + r.height / 2;
            const point = new Point(centerX, centerY, ball);
            qtree.insert(point);
        }

        // Collision detection of balls with nearby balls
        for (const ball of balls) {
            const r = ball.rect();
            const centerX = r.left + r.width / 2;
            const centerY = r.top + r.height / 2;
            const range = new Rectangle(centerX, centerY, r.width * 2, r.height * 2);
            const others = qtree.query(range);

            for (const point of others) {
                const other = point.userData;
                if (ball === other) continue;
                if (ball.isCollision(other)) {
                    ball.resolveOverlap(other);
                    ball.elasticCollisionHandle(other);
                }
            }
        }

        // Collision detection of balls with every other ball
        // for(let i = 0; i < balls.length; ++i) {
        //     for (let j = i+1; j < balls.length; ++j) {
        //         if (balls[i].isCollision(balls[j])) {
        //             balls[i].resolveOverlap(balls[j])
        //             balls[i].elasticCollisionHandle(balls[j])
        //         }
        //     }
        // }
    }
    
    // TODO: ADD PARTICLES/TRAIL
    gravity() {
        // velocity = speed * direction
        let vx = this.velocity * this.direction.x
        let vy = this.velocity * this.direction.y
        vy += GRAVITY
        this.velocity = Math.sqrt(vx * vx + vy * vy);
        this.direction.x = vx / this.velocity;
        this.direction.y = vy / this.velocity;
    }

    update(delta) {
        this.x += this.velocity * this.direction.x * delta
        this.y += this.velocity * this.direction.y * delta
        const degrees = Math.atan2(this.direction.y, this.direction.x) * (180 / Math.PI)
        this.angle = (degrees + 360) % 360 + 90 // 0 to 360 with 90 deg offset, add 360 to avoid -ve angle
        this.wallCollision()
    }
}

class Particle {
    constructor(size, color, direction) {
        this.size = size
        this.color = color
        this.direction = direction
    }
}

function convertPxToPercent(value, dimension) {
    return (value / dimension) * 100
}

function convertPercentToPx(value, dimension) {
    return (value * dimension) / 100
}

function moveBall(ball) {
    if (keys["w"] || keys["W"] || keys["ArrowUp"]) ball.y -= ball.movementSpeed;
    if (keys["s"] || keys["S"] || keys["ArrowDown"]) ball.y += ball.movementSpeed;
    if (keys["a"] || keys["A"] || keys["ArrowLeft"]) ball.x -= ball.movementSpeed;
    if (keys["d"] || keys["D"] || keys["ArrowRight"]) ball.x += ball.movementSpeed;
}

function createBall(id) {
    const div = document.createElement("div")
    const size = getRandomNumberBetween(2.5, 7)
    const r = getRandomNumberBetween(0, 256)
    const g = getRandomNumberBetween(0, 256)
    const b = getRandomNumberBetween(0, 256)
    div.classList.add("ball")
    div.id = "ball" + id.toString()
    div.style.backgroundColor = `rgb(${r}, ${g}, ${b})`
    div.style.setProperty("--size", size)
    newBallsContainer.appendChild(div)
    return new Ball(document.getElementById(div.id))
}

function getRandomNumberBetween(min, max) {
    return Math.random() * (max - min) + min
}

function restart() {
    ball.reset()
    balls = balls.slice(0, 1)
    newBallsContainer.innerHTML = ""
    measurementElem.textContent = "Average Speed"
    multipleBallsElem.classList.add('toggle')
    ball.ballElem.style.setProperty("--display", "none")
    toggleCollision = false
    toggleGravity = false
    isMove = false
    isCollisionRunning = true
    isGravityRunning = true
    istoggleRunning = true
    isToolsRunning = true
}

const ball = new Ball(document.getElementById("ball"))
const speedometerElem = document.getElementById("speedometer")
const upBtnElem = document.getElementById("upBtn")
const downBtnElem = document.getElementById("downBtn")
const resetBtnElem = document.getElementById("resetBtn")
const addBtnElem = document.getElementById("addBtn")
const newBallsContainer = document.getElementById('container')
const multipleBallsElem = document.getElementById('multiplBalls')
const collisionBtnElem = document.getElementById("collisionBtn")
const gravityBtnElem = document.getElementById("gravityBtn")
const moveBtnElem = document.getElementById("moveBtn")
const measurementElem = document.getElementById("measurement")
const controlBtnElem = document.getElementById("controlBtn")
const controlBtnElems = document.getElementById("controlButtons")
const toolsBtnElem = document.getElementById("toolsBtn")

let balls = [ball]
let ballId = 0

let toggleCollision = false
let isCollisionRunning = true
let toggleGravity = false
let isGravityRunning = true
let isMove = false
let istoggleRunning = true
let isControlRunning = true
let isToolsRunning = true

const keys = {"ArrowUp": false, "ArrowDown": false, "ArrowLeft": false, "ArrowRight": false,}

let lastTime
let lastFpsUpdate = 0
let fps = 0
let frames = 0

function updateFPS(timestamp) {
    frames++;
    if (timestamp - lastFpsUpdate >= 1000) {
        fps = frames;
        frames = 0;
        lastFpsUpdate = timestamp;

        console.log("FPS:", fps);
        console.log("BALLS", ballId + 1)
    }
}

function update(time) {
    updateFPS(time)
    if(lastTime != null) {
        let delta = time - lastTime
        // Update Code
        let avgSpeed, sum = 0
        for(const ball of balls) {
            if(!isMove) {
                ball.update(delta, balls)
            }
            if(toggleCollision) {
                ball.ballCollision(balls)
            }
            if(toggleGravity) {
                ball.gravity()
            } 
            if (isMove) {
                moveBall(balls[0])
            }
            sum += ball.velocity
        }
        avgSpeed = sum / balls.length
        if(isMove) speedometerElem.textContent = (ball.movementSpeed * 10).toFixed(1)
        else speedometerElem.textContent = (avgSpeed * 200).toFixed(1)
    }
    lastTime = time
    window.requestAnimationFrame(update)
}

window.addEventListener("keydown", (e) => {
    keys[e.key] = true;
})

window.addEventListener("keyup", (e) => {
    keys[e.key] = false;
})

upBtnElem.addEventListener("mousedown", e => {
    if(!isMove) {
        for(const ball of balls) {
            ball.velocity += 0.025
        }
    }
    ball.movementSpeed += 0.25
})

downBtnElem.addEventListener("mousedown", e => {
    if(!isMove) {
        for(const ball of balls) {
            ball.velocity -= 0.025
        }
    }
    ball.movementSpeed -= 0.25
})

resetBtnElem.addEventListener("mousedown", e => {
    restart()
})

moveBtnElem.addEventListener("mousedown", e => {
    restart()
    measurementElem.textContent = "Movement Speed"
    if(istoggleRunning) {
        isMove = true
    } else {
        isMove = false
    }
    istoggleRunning = !istoggleRunning
})

addBtnElem.addEventListener("mousedown", e => {
    if(!isMove) {
        ballId += 1
        balls.push(createBall(ballId))
        multipleBallsElem.classList.remove('toggle')
    }
})

collisionBtnElem.addEventListener("mousedown", e => {
    if(isCollisionRunning) {
        toggleCollision = true
    } else {
        toggleCollision = false
    }
    isCollisionRunning = !isCollisionRunning
})

gravityBtnElem.addEventListener("mousedown", e => {
    if(isGravityRunning) {
        toggleGravity = true
    } else {
        toggleGravity = false
    }
    isGravityRunning = !isGravityRunning
})

controlBtnElem.addEventListener("click", e => {
    if(isControlRunning) {
        controlBtnElems.style.transition = "all 0.25s ease-in-out";
        controlBtnElems.classList.remove("toggle")
    } else {
        controlBtnElems.classList.add("toggle")
    }
    isControlRunning = !isControlRunning
})

toolsBtnElem.addEventListener("mousedown", e => {
    if(!isMove) {
        if(isToolsRunning) {
            for (const ball of balls) {
                ball.ballElem.style.setProperty("--display", "inline-block")
            }
        } else {
            for (const ball of balls) {
                ball.ballElem.style.setProperty("--display", "none")
            }
        }
        isToolsRunning = !isToolsRunning
    }
})

window.requestAnimationFrame(update)