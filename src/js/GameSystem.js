export const canvas = document.createElement('canvas');
canvas.width = 1280;
canvas.height = 780;
export const ctx = canvas.getContext('2d');


export class Vector{
	constructor(x, y){
		this.x = x;
		this.y = y;
	}

	dup(){
		return (new Vector(this.x, this.y));
	}

	add(otherVector){
		return (new Vector(this.x + otherVector.x, this.y + otherVector.y));
	}

	sub(otherVec){
		return (new Vector(this.x - otherVec.x, this.y - otherVec.y));
	}

	normalize(){
		let len = this.length();
		this.x /= len;
		this.y /= len;
		return this;
	}

	scale(size){
		this.x *= size;
		this.y *= size;
		return this;
	}

	rotate(degree) {
		const radians = degree * (Math.PI / 180);

		const cos = Math.cos(radians);
		const sin = Math.sin(radians);

		const newX = this.x * cos - this.y * sin;
		const newY = this.x * sin + this.y * cos;

		this.x = newX;
		this.y = newY;
		return this;
	}

	dot(other){
		return (this.x * other.x + this.y * other.y);
	}

	cross(other) {
		return this.y * other.x - this.x * other.y;
	}

	sqrLength(){
		return (Math.pow(this.x, 2) + Math.pow(this.y, 2));
	}

	length(){
		return (Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2)));
	}

	lerp(other, alpha) {
		return new Vector(
			this.x + (other.x - this.x) * alpha,
			this.y + (other.y - this.y) * alpha
		);
	}

	negate() {
		return new Vector(-this.x, -this.y);
	}
}

export class Plane{
	constructor(start, dir){
		this.start = start.dup();
		this.dir = dir.dup();
	}

	rotate(deg){
		this.dir.rotate(deg);
		return this;
	}

	getTangent(){
		return (new Plane(this.start, this.dir.dup().rotate(90)));
	}

	getClosestPoint(point){
		let normDir = this.dir.dup().normalize();
		let v = point.sub(this.start);
		let t = v.dot(normDir);
		t = Math.max(0, Math.min(t, this.dir.dot(normDir)));
		let cp = this.start.add(normDir.scale(t));
		return cp;
	}
}

export class Transform{
	constructor(posX, posY, rotation = 0){
		this.position = new Vector(posX, posY);
		this.rotation = rotation;
		this.up = new Vector(0, -1);
		this.up.rotate(this.rotation);
	}

	getData(){
		return ({
			position: 
			{
				x: this.position.x,
				y: this.position.y
			},
			rotation: this.rotation
			});
	}

	rotate(deg){
		this.up.rotate(deg - this.rotation);
		this.rotation = deg;
	}
}

/**
 * Abstract class Component
 * Base for all componets using Entity Component System
 */
export class Component{
	constructor(){

	}
}

/**
 * Physics component
 * responsible for storing Entitys movement direction
 */
export class Physics extends Component{
	constructor(x = 0, y = 0, isStatic = false, hasGravity = true){
		super();
		this.hasGravity = hasGravity;
		this.isStatic = isStatic;
		this.velocity = new Vector(x, y);
	}

	setVelocity(dx, dy){
		this.velocity.x = dx;
		this.velocity.y = dy;
	}

	setVelocityV(vec){
		this.velocity = vec;
	}
}

/**
 * Mesh component
 * Contains all the points of the mesh.
 * The points are relative to the center of the Mesh
 * World position will be added each draw by passing the Entitys transform data
 * comes with a generic draw function for Meshes with more than 2 points
 * Draw can be overloaded like in the Circle class, which does not need points
 */
export class Mesh extends Component{
	constructor(isTrigger = false, colour = 'white'){
		super();
		this.isTrigger = isTrigger;
		this.colour = colour;
		this.points = [];
	}

	draw(transform){
		if (this.points.length == 0)
			return;
		let prevFillStyle = ctx.fillStyle;
		ctx.fillStyle = this.colour;
		ctx.beginPath();

		let transformedPoints = this.points.map(p => p.dup().rotate(transform.rotation).add(transform.position));

		let point = new Vector(transformedPoints[0].x, transformedPoints[0].y)
		ctx.moveTo(point.x, point.y);
		for (let i = 1; i < transformedPoints.length; i++) {
			point = transformedPoints[i];
			ctx.lineTo(point.x, point.y);
		}
		point = transformedPoints[0];
		ctx.lineTo(point.x, point.y);
		ctx.closePath();
		ctx.fill();
		ctx.fillStyle = prevFillStyle;
	}

	/**
	 * 
	 * @param {Transform} transform entity transform
	 * @param {Vector} point the point to get closest to
	 * @returns point on one of the meshes edges closes to the given point
	 */
	getClosestPoint(transform, point){
		let closestPoint = undefined;
		let smallestDist = Infinity;

		let transformedPoints = this.points.map(p => p.dup().rotate(transform.rotation).add(transform.position));

		for (let i = 0; i < transformedPoints.length; i++) {
			let pointA = transformedPoints[i];
			let pointB = transformedPoints[(i + 1) % transformedPoints.length];

			let planeAB = new Plane(pointA, pointB.sub(pointA));

			// drawLine(planeAB.start, planeAB.dir.add(planeAB.start));
			
			let currPoint = planeAB.getClosestPoint(point);
			let line = currPoint.sub(point);
			let dist = line.sqrLength();
			
			if (dist < smallestDist) {
				smallestDist = dist;
				closestPoint = currPoint;
			}
		}
		return (closestPoint);
	}

	getWorldPoints(transform) {
		return this.points.map(p => p.dup().rotate(transform.rotation).add(transform.position));
	}
}

export class Circle extends Mesh{
	constructor(width, isTrigger = false){
		super(isTrigger);
		this.width = this.height = width;
	}

	draw(transform){
		let prevFillStyle = ctx.fillStyle;
		ctx.fillStyle = this.colour;
		ctx.beginPath();
		ctx.arc(transform.position.x, transform.position.y, this.width * 0.5, 0, 360);
		ctx.closePath();
		ctx.fill();
		ctx.fillStyle = prevFillStyle;
	}

	getClosestPoint(transform, point){
		let closestPoint = point.sub(transform.position);
		closestPoint.normalize();
		closestPoint.scale(this.width * 0.5);
		closestPoint = closestPoint.add(transform.position);
		return (closestPoint);
	}

	getWorldPoints(transform) {
		return [transform.position, transform.position.add(new Vector(1, 0).scale(this.width * 0.5))];
	}
}

export class Box extends Mesh{
	constructor(w, h, isTrigger = false){
		super(isTrigger);
		this.width = w;
		this.height = h;
		this.points.push(new Vector(-(this.width * 0.5), this.height * 0.5));
		this.points.push(new Vector(this.width * 0.5, this.height * 0.5));
		this.points.push(new Vector(this.width * 0.5, -(this.height * 0.5)));
		this.points.push(new Vector(-(this.width * 0.5), -(this.height * 0.5)));
	}
}

/**
 * Entity
 */
export class Entity extends Transform{
	constructor(x, y){
		super(x, y);
		this.components = {};
	}

	onCollision(other, collsionPoint = undefined){

	}

	onTrigger(other, collisionPoint = undefined){

	}

	addComponent(type, component){
		// if (!(type in this.components)){
			this.components[type] = component;
		// } else {
			// this.components[type] = component;
		// }
	}

	getComponent(type){
		return this.components[type];
	}

	hasComponent(type){
		return type in this.components;
	}

	move(xAdd, yAdd){
		this.position.x += xAdd;
		this.position.y += yAdd;
	}

	setPos(x, y) {
		this.position.x = x;
		this.position.y = y;
	}

	update(){
	}
}

export class System{
	execute(entities){}
}

export class RenderSystem extends System{
	execute(entities){
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		entities.forEach(entity => {
			const mesh = entity.getComponent(Mesh);
			if (mesh){
				mesh.draw(entity);
			}
		});
	}
}

export class MovementSystem extends System{
	execute(entities){
		entities.forEach(entity => {
			const phys = entity.getComponent(Physics);
			if (phys){
				if (phys.hasGravity){
					phys.setVelocity(phys.velocity.x, phys.velocity.y + 0.0981);
				}
				entity.move(phys.velocity.x, phys.velocity.y);
			}
		});
	}
}

//functions for GJK
function getFarthestPonintOfShape(shape, direction) {
	if (shape.length == 2) {
		return direction.dup().normalize().scale(shape[0].sub(shape[1]).length());
	}
	let farthestPoint = shape[0];
	let maxDot = farthestPoint.dot(direction);

	for (let i = 1; i < shape.length; i++) {
		const dot = shape[i].dot(direction);
		if (dot > maxDot) {
			maxDot = dot;
			farthestPoint = shape[i];
		}
	}
	return farthestPoint;
}

function minkowskiDifference(shapeA, shapeB, dir) {
	return getFarthestPonintOfShape(shapeA, dir).sub(getFarthestPonintOfShape(shapeB, dir.negate()));
}

function gjk(shapeA, shapeB) {
	let direction = new Vector(1, 0);
	const simplex = [minkowskiDifference(shapeA, shapeB, direction)];

	while (true) {
		direction = closestPointToOrigin(simplex).negate();
		const newPoint = minkowskiDifference(shapeA, shapeB, direction);

		if (newPoint.dot(direction) <= 0) {
			return false
		}

		simplex.push(newPoint);

		if (containsOrigin(simplex)) {
			return true;
		}
	}
}

function closestPointToOrigin(simplex) {
    if (simplex.length === 1) {
        return simplex[0];
    } else if (simplex.length === 2) {
        return closestPointOnLineToOrigin(simplex[0], simplex[1]);
    } else if (simplex.length === 3) {
        return closestPointOnTriangleToOrigin(simplex[0], simplex[1], simplex[2]);
    }
}

function closestPointOnLineToOrigin(a, b) {
	const ab = b.sub(a);
    const ao = a.dup().scale(-1);
	const t = ao.dot(ab) / ab.dot(ab);
    const closestPoint = a.add(ab.scale(Math.max(0, Math.min(1, t))));
    return closestPoint;
}

function closestPointOnTriangleToOrigin(a, b, c) {
	const ab = b.sub(a);
    const ac = c.sub(a);
    const ao = a.dup().scale(-1);

	const abDot = ab.dot(ab);
	const acDot = ac.dot(ac);
	const abAcDot = ab.dot(ac);
	const aoAbDot = ao.dot(ab);
	const aoAcDot = ao.dot(ac);

    const det = abDot * acDot - abAcDot * abAcDot;
    const u = (acDot * aoAbDot - abAcDot * aoAcDot) / det;
    const v = (abDot * aoAcDot - abAcDot * aoAbDot) / det;

    if (u >= 0 && v >= 0 && u + v <= 1) {
        return a.add(ab.scale(u)).add(ac.scale(v));
    }

    if (u < 0) {
        return closestPointOnLineToOrigin(a, c);
    } else if (v < 0) {
        return closestPointOnLineToOrigin(a, b);
    } else {
        return closestPointOnLineToOrigin(b, c);
    }
}

function containsOrigin(simplex) {
    if (simplex.length === 2) {
        // Line case
        const a = simplex[0];
        const b = simplex[1];
        const ab = b.sub(a);
        const ao = a.dup().scale(-1);
		const t = ao.dot(ab) / ab.dot(ab);
        const closestPoint = a.add(ab.scale(Math.max(0, Math.min(1, t))));
        return closestPoint.sqrLength() < 1e-6; // Check if closest point is close to origin
    } else if (simplex.length === 3) {
        // Triangle case
        const a = simplex[0];
        const b = simplex[1];
        const c = simplex[2];

        const ab = b.sub(a);
        const ac = c.sub(a);
        const ao = a.dup().scale(-1);

        const abDot = ab.dot(ab);
        const acDot = ac.dot(ac);
        const abAcDot = ab.dot(ac);
        const aoAbDot = ao.dot(ab);
        const aoAcDot = ao.dot(ac);

        const det = abDot * acDot - abAcDot * abAcDot;
        const u = (acDot * aoAbDot - abAcDot * aoAcDot) / det;
        const v = (abDot * aoAcDot - abAcDot * aoAbDot) / det;

        return u >= 0 && v >= 0 && u + v <= 1;
    }
    return false;
}

export class CollisionSystem extends System{
	execute(entities){
		for (let currentEnt of entities){
			const entMesh = currentEnt.getComponent(Mesh);
			const entPhys = currentEnt.getComponent(Physics);
			if (!entMesh || !entPhys)
				continue;
			for (let otherEnt of entities){
				if (currentEnt == otherEnt)
					continue;
				const otherMesh = otherEnt.getComponent(Mesh);
				if (!otherMesh) {
					continue;
				}

				const shapeA = entMesh.getWorldPoints(currentEnt);
				const shapeB = otherMesh.getWorldPoints(otherEnt);
				console.log('Points', shapeA, shapeB);
				
				if (gjk(shapeA, shapeB)) {
					console.log("COLLISION!!!");
					drawLine(currentEnt.position, otherEnt.position, 'red');
				}
			}
		}
	}
}

export class World{
	constructor(){
		this.entities = [];
		this.systems = [];
	}

	addEntity(ent){
		this.entities.push(ent);
	}

	removeEntity(ent){
		const index = this.entities.indexOf(ent);
		if (index !== -1)
			this.entities.splice(index, 1);
	}

	addSystem(sys){
		this.systems.push(sys);
	}

	update(){
		this.systems.forEach(sys => {
			sys.execute(this.entities);
		});

		this.entities.forEach(ent =>{
			ent.update();
		});
	}
}

export function drawText(text, x, y, textStyle = undefined, colour = 'black'){
	let save = ctx.font;
	let saveStyle = ctx.fillStyle;
	if (textStyle)
		ctx.font = textStyle;
	ctx.fillStyle = colour;
	ctx.fillText(text, x, y);
	ctx.fillStyle = saveStyle;
	ctx.font = save;
}

export function strokeText(text, x, y, textStyle = undefined, colour = 'black'){
	let save = ctx.font;
	let saveStyle = ctx.strokeStyle;
	if (textStyle)
		ctx.font = textStyle;
	ctx.strokeStyle = colour;
	ctx.strokeText(text, x, y);
	ctx.strokeStyle = saveStyle;
	ctx.font = save;
}

export function drawLine(p1, p2, color = 'black', lineWidth = 1, dashPattern = [], debug = false){
	ctx.beginPath();
	ctx.moveTo(p1.x, p1.y);
	if (debug){
		let mid = p2.sub(p1);
		let len = mid.length();
		mid.scale(0.5);
		mid = p1.add(mid);
		ctx.fillText(len, mid.x, mid.y);
		ctx.fillRect(p2.x, p2.y, 5, 5);
	}
	ctx.lineTo(p2.x, p2.y);
	ctx.closePath();

	let savestroke = ctx.strokeStyle;
	let savefill = ctx.fillStyle;
	let savewidth = ctx.lineWidth;
	let savePattern = ctx.getLineDash();

	ctx.lineWidth = lineWidth;
	ctx.setLineDash(dashPattern);
	ctx.fillStyle = color;
	ctx.strokeStyle = color;
	ctx.stroke();
	ctx.fillStyle = savefill;
	ctx.strokeStyle = savestroke;
	ctx.lineWidth = savewidth;
	ctx.setLineDash(savePattern);
}
