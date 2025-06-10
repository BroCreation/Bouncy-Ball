const INITIAL_VELOCITY = 0.025;

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

    // TODO: Proper Elastic Collision with balls of different sizes/masses
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
            const heading = getRandomNumberBetween(0, 2 * Math.PI)
            this.direction = {x: Math.cos(heading), y: Math.sin(heading)}
        }
        this.velocity = INITIAL_VELOCITY
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
        // Collision detection for balls
        if(balls.length > 1) {
            for(let i = 0; i < balls.length; i++) {
                let ballA = balls[i]
                for(let j = i+1; j < balls.length; j++) {
                    if(ballA.isCollision(balls[j])) {
                        ballA.resolveOverlap(balls[j]);
                        ballA.elasticCollisionHandle(balls[j])
                    }
                }
            }
        }
    }

    update(delta) {
        this.x += this.velocity * this.direction.x * delta
        this.y += this.velocity * this.direction.y * delta
        this.wallCollision()
    }
}

function convertPxToPercent(value, dimension) {
    return (value / dimension) * 100
}

function convertPercentToPx(value, dimension) {
    return (value * dimension) / 100
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

const ball = new Ball(document.getElementById("ball"))
const speedometerElem = document.getElementById("speedometer")
const upBtnElem = document.getElementById("upBtn")
const downBtnElem = document.getElementById("downBtn")
const resetBtnElem = document.getElementById("resetBtn")
const addBtnElem = document.getElementById("addBtn")
const newBallsContainer = document.getElementById('container')
const multipleBallsElem = document.getElementById('multiplBalls')
const collisionBtn = document.getElementById("collisionBtn")
let balls = [ball]
let ballId = 0
let toggleCollision = false

let lastTime
function update(time) {
    if(lastTime != null) {
        let delta = time - lastTime
        // Update Code
        let avgSpeed, sum = 0
        for(const ball of balls) {
            ball.update(delta, balls)
            if(toggleCollision) {
                ball.ballCollision(balls)
            }
            sum += ball.velocity
        }
        avgSpeed = sum / balls.length
        speedometerElem.textContent = (avgSpeed * 200).toFixed(1)
    }
    lastTime = time
    window.requestAnimationFrame(update)
}

upBtnElem.addEventListener("mousedown", e => {
    for(const ball of balls) {
        ball.velocity += 0.025
    }
})

downBtnElem.addEventListener("mousedown", e => {
    for(const ball of balls) {
        ball.velocity -= 0.025
    }
})

resetBtnElem.addEventListener("mousedown", e => {
    ball.reset()
    newBallsContainer.innerHTML = ""
    balls = balls.slice(0, 1)
    multipleBallsElem.classList.add('toggle')
    toggleCollision = false
})

addBtnElem.addEventListener("mousedown", e => {
    ballId += 1
    balls.push(createBall(ballId))
    multipleBallsElem.classList.remove('toggle')
})

let isRunning = true
collisionBtn.addEventListener("mousedown", e => {
    if(isRunning) {
        toggleCollision = true
    } else {
        toggleCollision = false
    }
    isRunning = !isRunning
})

window.requestAnimationFrame(update)