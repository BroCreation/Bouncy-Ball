export class Point {
    constructor(x, y, userData) {
        this.x = x
        this.y = y
        this.userData = userData
    }
}

export class Rectangle {
    constructor(x, y, w, h) {
        this.x = x
        this.y = y
        this.w = w
        this.h = h
    }

    contains(point) {
        return (point.x >= this.x - this.w/2 && 
            point.x <= this.x + this.w/2 &&
            point.y >= this.y - this.h/2 &&
            point.y <= this.y + this.h/2)
    }

    intersects(range) {
        return !(range.x - range.w > this.x + this.w &&
                range.x + range.w < this.x - this.w &&
                range.y - range.h > this.y + this.h &&
                range.y + range.w < this.y - this.h)
    }
}

export class Quadtree {
    constructor(boundary, n) {
        this.boundary = boundary
        this.capacity = n
        this.points = []
        this.divided = false
    }

    subdivide() {
        let {x, y, w, h} = this.boundary

        this.topleft = new Quadtree(new Rectangle(x - w / 4, y - h / 4, w / 2, h / 2), this.capacity)
        this.topright = new Quadtree(new Rectangle(x + w / 4, y - h / 4, w / 2, h / 2), this.capacity)
        this.bottomleft = new Quadtree(new Rectangle(x - w / 4, y + h / 4, w / 2, h / 2), this.capacity)
        this.bottomright = new Quadtree(new Rectangle(x + w / 4, y + h / 4, w / 2, h / 2), this.capacity)
    }

    insert(point) {
        // If there are more points than capacity of parent boundary then 
        // subdivide and insert points into new boundary if it contains the point
        // Repeat this process
        if (!this.boundary.contains(point)) {
            return
        }
        
        if(this.points.length < this.capacity) {
            this.points.push(point)
        } else {
            if (!this.divided) {
                this.subdivide()
                this.divided = true
            }
            
            if (this.divided) {
                this.topleft.insert(point)
                this.topright.insert(point)
                this.bottomleft.insert(point)
                this.bottomright.insert(point)
            }
        }
    }

    query(range, found) {
        if(!found) {
            found = []
        }
        
        // check if the quad is even intersecting with the range(rectangle), end of recursive calls
        if (!this.boundary.intersects(range)) return found

        // loop through all points of quad and push those points of that quad with max capacity(4) that are contained in the range
        for (let p of this.points) {
            if(range.contains(p)) {
                found.push(p)
            }
        }

        // Lastly do all the sub divisions of the parent quad and keep pushing all points within the range
        if(this.divided) {
            this.topleft.query(range, found)
            this.topright.query(range, found)
            this.bottomleft.query(range, found)
            this.bottomright.query(range, found)
        }

        // return found for the root boundary
        return found
    }
}