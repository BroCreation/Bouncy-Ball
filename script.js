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

    collisionHandle(ballA, ballB) {
        // When both masses are equal
        let tempA = {v: ballA.velocity, d: ballA.direction}
        if(ballA.size === ballB.size) {
            ballA.velocity = ballB.velocity
            ballA.direction = ballB.direction
            ballB.velocity = tempA.v
            ballB.direction = tempA.d
        } 
    }

    resolveOverlap(other) {
        const rect1 = this.rect();
        const rect2 = other.rect();
        const r1 = rect1.width / 2;
        const r2 = rect2.width / 2;

        const x1 = rect1.left + r1;
        const y1 = rect1.top + r1;
        const x2 = rect2.left + r2;
        const y2 = rect2.top + r2;

        const dx = x2 - x1;
        const dy = y2 - y1;
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance === 0) distance = 0.1; // prevent NaN

        const overlap = r1 + r2 - distance;

        if (overlap > 0) {
            const moveX = (dx / distance) * (overlap / 2);
            const moveY = (dy / distance) * (overlap / 2);

            // Convert pixels to percentages
            const offsetX = (moveX / window.innerWidth) * 100;
            const offsetY = (moveY / window.innerHeight) * 100;

            this.x -= offsetX;
            this.y -= offsetY;
            other.x += offsetX;
            other.y += offsetY;
        }
    }

    
    update(delta, balls) {
        this.x += this.velocity * delta * this.direction.x
        this.y += this.velocity * delta * this.direction.y
        // const rect = this.rect()

        // Collision detection for walls
        // if(rect.bottom >= window.innerHeight || rect.top <= 0) {
        //     this.direction.y *= -1
        // }
        
        // if(rect.right >= window.innerWidth || rect.left <= 0) {
        //     this.direction.x *= -1
        // }
        // TODO: CLEAN THE CODE, PX AND PERCENTAGES ARE USED. SHOULD ONLY HAVE ONE UNIT IN CODE
        // Wall Overlapping
        const radiusPx = this.rect().width / 2;
        const posXPx = this.x / 100 * window.innerWidth;
        const posYPx = this.y / 100 * window.innerHeight;

        if (posYPx + radiusPx >= window.innerHeight) {
            this.y = ((window.innerHeight - radiusPx) / window.innerHeight) * 100;
            this.direction.y *= -1;
        } else if (posYPx - radiusPx <= 0) {
            this.y = (radiusPx / window.innerHeight) * 100;
            this.direction.y *= -1;
        }

        if (posXPx + radiusPx >= window.innerWidth) {
            this.x = ((window.innerWidth - radiusPx) / window.innerWidth) * 100;
            this.direction.x *= -1;
        } else if (posXPx - radiusPx <= 0) {
            this.x = (radiusPx / window.innerWidth) * 100;
            this.direction.x *= -1;
        }

        // Collision detection for balls
        if(balls.length > 1) {
            for(let i = 0; i < balls.length; i++) {
                let ballA = balls[i]
                for(let j = i+1; j < balls.length; j++) {
                    if(ballA.isCollision(balls[j])) {
                        this.collisionHandle(ballA, balls[j])
                        ballA.resolveOverlap(balls[j]);
                    }
                }
            }
        }
    }
}

function createBall(id) {
    const div = document.createElement("div")
    const r = getRandomNumberBetween(0, 256)
    const g = getRandomNumberBetween(0, 256)
    const b = getRandomNumberBetween(0, 256)
    div.classList.add("ball")
    div.id = "ball" + id.toString()
    div.style.backgroundColor = `rgb(${r}, ${g}, ${b})`
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
let balls = [ball]
let ballId = 0

let lastTime
function update(time) {
    if(lastTime != null) {
        let delta = time - lastTime
        // Update Code
        for(const ball of balls) {
            ball.update(delta, balls)
        }
        speedometerElem.textContent = Math.round(ball.velocity * 200) 
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
})

addBtnElem.addEventListener("mousedown", e => {
    ballId += 1
    balls.push(createBall(ballId))
    multipleBallsElem.classList.remove('toggle')
})

window.requestAnimationFrame(update)