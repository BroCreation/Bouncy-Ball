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

    rect() {
        return this.ballElem.getBoundingClientRect()
    }

    reset() {
        this.x = 50
        this.y = 50
        this.direction = {x: 0}
        while(Math.abs(this.direction.x <= 0.2) || Math.abs(this.direction.x >= 0.9)) {
            const heading = getRandomNumberBetween(0, 2 * Math.PI)
            this.direction = {x: Math.cos(heading), y: Math.sin(heading)}
        }
        this.velocity = INITIAL_VELOCITY
    }

    update(delta) {
        this.x += this.velocity * delta * this.direction.x
        this.y += this.velocity * delta * this.direction.y
        const rect = this.rect()

        // Collision detection for walls
        if(rect.bottom >= window.innerHeight || rect.top <= 0) {
            this.direction.y *= -1
        }
        
        if(rect.right >= window.innerWidth || rect.left <= 0) {
            this.direction.x *= -1
            // if(Math.av)
        }
        // TODO: Collision detection for balls
        
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
            ball.update(delta)
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
    console.log(balls)
    multipleBallsElem.classList.remove('toggle')
})

window.requestAnimationFrame(update)