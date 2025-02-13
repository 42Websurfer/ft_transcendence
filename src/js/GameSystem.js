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

	set(x, y) {
		this.x = x;
		this.y = y;
	}

	setV(other) {
		this.x = other.x;
		this.y = other.y;
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
		return [transform.position.dup(), transform.position.add(new Vector(1, 0).scale(this.width * 0.5))];
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

//#region functions for GJK 
//guide/inspo https://winter.dev/articles/gjk-algorithm
function getFarthestPointOfShape(shape, direction) {
	if (shape.length == 2) {
		return direction.dup().normalize().scale(shape[0].sub(shape[1]).length()).add(shape[0]);
	}
	let farthestPoint = shape[0];
	let maxDot = -Infinity;

	for (let i = 0; i < shape.length; i++) {
		const dot = shape[i].dot(direction);
		if (dot > maxDot) {
			maxDot = dot;
			farthestPoint = shape[i];
		}
	}
	return farthestPoint;
}

function minkowskiDifference(shapeA, shapeB, dir) {
	function fullMinkowDraw() {
		let diff = [];
		for (let pa of shapeA) {
			for (let pb of shapeB) {
				diff.push(CENTER.add(pa.sub(pb)));
			} 
		}
		for (let point of diff) {
			ctx.fillRect(point.x, point.y, 5 ,5);
		}
	}
	fullMinkowDraw();
	let ga = getFarthestPointOfShape(shapeA, dir);
	let gb = getFarthestPointOfShape(shapeB, dir.negate());
	drawLine(ga,gb, 'yellow');
	return getFarthestPointOfShape(shapeA, dir).sub(getFarthestPointOfShape(shapeB, dir.negate()));
}

const CENTER = new Vector(canvas.width * 0.5, canvas.height * 0.5);

function gjk(shapeA, shapeB) {
	let support = minkowskiDifference(shapeA, shapeB, new Vector(1, 0));
	let simplex = [support];
	drawLine(CENTER, CENTER.add(support), 'blue');
	
	let direction = support.negate();
	let iter = 0;
	const maxIter = (shapeA.length + shapeB.length) * 0.5;
	ctx.fillRect(CENTER.x, CENTER.y, 5, 5);
	drawLine(CENTER, CENTER.add(direction), 'green');
	while (iter < maxIter) {
		support = minkowskiDifference(shapeA, shapeB, direction);
		drawLine(CENTER, CENTER.add(support), 'blue');
		if (support.dot(direction) <= 0) {
			drawLine(CENTER, CENTER.add(direction), 'green', iter * 2 + 1);
			
			return {colliding: false, mtv: undefined};
		}
		drawLine(CENTER, CENTER.add(direction), 'yellow', iter * 2 + 1);
		simplex.unshift(support);
		
		if (nextSimplex(simplex, direction)) {
			return {colliding: true, mtv: calculateMTV(shapeA, shapeB, simplex)};
		}
		iter++;
	}
	return {colliding: false, mtv: undefined};
}

function calculateMTV(shapeA, shapeB, simplex) {
	let minDist = Infinity;
	let minNormal;
	let minIndex = 0;

	for (let i = 0; i < simplex.length; i++) {
		const a = simplex[i];
		const b = simplex[(i + 1) % simplex.length];

		const ab = b.sub(a);
		let normal = new Vector(-ab.y, ab.x).normalize();
		let distance = normal.dot(a);

		if (distance <= 0) {
			distance *= -1;
			normal.scale(-1);
		}

		if (distance < minDist) {
			minDist = distance;
			minNormal = normal;
			minIndex = i + 1;
		}
	}
	let support = minkowskiDifference(shapeA, shapeB, minNormal);
	let sDistance = minNormal.dot(support);

	// if (Math.abs(sDistance - minDist) > 0.001) {
	// 	minDist = Infinity;
	// }

	return minNormal.scale(minDist + 0.001);
}

function vectorsAreSameDirection(v1, v2) {
	return v1.dot(v2) > 0;
}

function nextSimplex(simplex, direction) {
	switch (simplex.length) {
		case 2: return line(simplex, direction);
		case 3: return triangle(simplex, direction);
	}
	return false;
}

function line(simplex, direction) {
	let a = simplex[0];
	let b = simplex[1];
	let AB = b.sub(a);
	let AO = a.negate();

	if (vectorsAreSameDirection(AB, AO)) {
		direction.set(-AB.y, AB.x);
	} else {
		direction.setV(AO);
		simplex.pop();
		simplex[0] = a;
	}
	return false;
}

function triangle(simplex, direction) {
	let debugPoints = simplex.map(p => p.dup().add(CENTER));
	for (let i = 0; i < debugPoints.length; i++) {
		const a = debugPoints[i];
		const b = debugPoints[(i + 1) % debugPoints.length];

		drawLine(a, b, 'green');
		
	}

	let a = simplex[0];
	let b = simplex[1];
	let c = simplex[2];

	let ab = b.sub(a);	
	let ac = c.sub(a);	
	let ao = a.negate();

	let acCrossAo = ab.x * ao.y - ab.y * ao.x;
	if (acCrossAo > 0) {
		if (vectorsAreSameDirection(ac, ao)) {
			direction.set(-ac.y, ac.x);
			simplex.pop();
			simplex[0] = a;
			simplex[1] = c;
		} else {
			simplex.pop();
			return line(simplex, direction);
		}
	} else {
		let abCrossAo = ac.x * ao.y - ac.y * ao.x;

		if (abCrossAo > 0) {
			simplex.pop();
			return line(simplex, direction);
		} else {
			return true;
		}
	}

	return false;
}
//#endregion

export class CollisionSystem extends System{
	execute(entities){
		for (let currentEnt of entities){
			const entMesh = currentEnt.getComponent(Mesh);
			const entPhys = currentEnt.getComponent(Physics);
			if (!entMesh || !entPhys /*|| entPhys.velocity.sqrLength() == 0*/)
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
				const result = gjk(shapeA, shapeB);
				if (result.colliding) {
					console.log("COLLISION!!!");
					drawLine(currentEnt.position, otherEnt.position, 'red');
					const mtv = result.mtv;
					drawLine(currentEnt.position, currentEnt.position.add(mtv.dup().scale(10)), 'purple');
					if (!entPhys.isStatic) {
						currentEnt.move(mtv.x, mtv.y);
					}
					const otherPhys = otherEnt.getComponent(Physics);
					if (otherPhys && !otherPhys.isStatic) {
						otherEnt.move(-mtv.x, -mtv.y);
					}

					if (entMesh.isTrigger){
						currentEnt.onTrigger(otherEnt, mtv);
					} else {
						currentEnt.onCollision(otherEnt, mtv);
					}
					if (otherMesh.isTrigger){
						otherEnt.onTrigger(currentEnt, mtv);
					} else {
						otherEnt.onCollision(currentEnt, mtv);
					}
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
