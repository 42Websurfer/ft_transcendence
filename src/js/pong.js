const canvas = document.createElement('canvas');
canvas.width = 1280;
canvas.height = 720;
const ctx = canvas.getContext('2d');
const PLAYER_MOVE_SPEED = 10;

export function renderPong() {
	const app = document.getElementById('app');
	if (app)
		app.appendChild(canvas);
}

class Vector{
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

	sqrLength(){
		return (Math.pow(this.x, 2) + Math.pow(this.y, 2));
	}

	length(){
		return (Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2)));
	}

}

class Plane{
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

class Transform{
	constructor(posX, posY, rotation = 0){
		this.position = new Vector(posX, posY);
		this.rotation = rotation;
		this.up = new Vector(0, -1);
		this.up.rotate(this.rotation);
	}

	rotate(deg){
		this.rotation = deg;
		this.up.rotate(deg);
	}
}

class Component{
	constructor(){

	}
}

class Physics extends Component{
	constructor(x = 0, y = 0){
		super();
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

class Mesh extends Component{
	constructor(){
		super();
		this.points = [];
	}

	draw(transform){
		if (this.points.length == 0)
			return;
		ctx.beginPath();
		let point = new Vector(this.points[0].x, this.points[0].y)
		point.rotate(transform.rotation);
		point = point.add(transform.position);
		ctx.moveTo(point.x, point.y);
		for (let i = 1; i < this.points.length; i++) {
			point = new Vector(this.points[i].x, this.points[i].y);
			point.rotate(transform.rotation);
			point = point.add(transform.position);
			ctx.lineTo(point.x, point.y);
		}
		point = this.points[0].dup();
		point.rotate(transform.rotation);
		point = point.add(transform.position);
		ctx.lineTo(point.x, point.y);
		ctx.closePath();
		ctx.fill();
	}

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
}

class Entity extends Transform{
	constructor(x, y){
		super(x, y);
		this.components = {};
	}

	onCollision(other, collsionPoint = undefined){

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

	update(){
	}
}

class Circle extends Mesh{
	constructor(width){
		super();
		this.width = this.height = width;
	}

	draw(transform){
		ctx.beginPath();
		ctx.arc(transform.position.x, transform.position.y, this.width * 0.5, 0, 360);
		ctx.closePath();
		ctx.fill();
	}

	getClosestPoint(transform, point){
		let closestPoint = point.sub(transform.position);
		closestPoint.normalize();
		closestPoint.scale(this.width * 0.5);
		closestPoint = closestPoint.add(transform.position);
		return (closestPoint);
	}
}

class Box extends Mesh{
	constructor(w, h){
		super();
		this.width = w;
		this.height = h;
		this.points.push(new Vector(-(this.width * 0.5), this.height * 0.5));
		this.points.push(new Vector(this.width * 0.5, this.height * 0.5));
		this.points.push(new Vector(this.width * 0.5, -(this.height * 0.5)));
		this.points.push(new Vector(-(this.width * 0.5), -(this.height * 0.5)));
	}
}

class Ball extends Entity{
	constructor(x = canvas.width / 2, y = canvas.height / 2){
		super(x, y);
		this.addComponent(Mesh, new Circle(40));
		this.physics = new Physics(15,0);
		this.addComponent(Physics, this.physics);
	}

	onCollision(other, collsionPoint = undefined){
		this.physics.velocity.x *= -1;
	}

}

class Player extends Entity{
	constructor(x, y){
		super(x, y);
		this.mesh = new Box(40, 250);
		this.addComponent(Mesh, this.mesh);
		this.keyBinds = {up: 'ArrowUp', down: 'ArrowDown'};
		window.addEventListener('keydown', (event) => this.keyDown(event));
		window.addEventListener('keyup', (event) => this.keyUp(event));
		this.moveDir = new Vector(0,0);
	}

	move(xAdd, yAdd){
		let newPos = this.position.add(new Vector(xAdd, yAdd));
		for (let point of this.mesh.points) {
			point = point.add(newPos);
			if (point.x < 0 || point.x > canvas.width)
				return;
			if (point.y < 0 || point.y > canvas.height)
				return;
		}
		this.position = newPos;
	}

	update(){
		this.move(this.moveDir.x, this.moveDir.y);
		super.update();
	}

	keyDown(event){
		if (event.key === this.keyBinds.up){
			let dir = new Vector(this.up.x, this.up.y);
			dir.scale(PLAYER_MOVE_SPEED);
			this.moveDir = dir;
		}
		if (event.key === this.keyBinds.down) {
			let dir = new Vector(this.up.x, this.up.y);
			dir.scale(-PLAYER_MOVE_SPEED);
			this.moveDir = dir;
		}
		if (event.key === 'g')
			this.rotate(this.rotation + 5);
	}

	keyUp(event){
		if (event.key === this.keyBinds.up || event.key === this.keyBinds.down)
			this.moveDir.x = 0; this.moveDir.y = 0;
	}
}

class Wall extends Entity{
	constructor(x, y, top = false){
		super(x, y);
		if (top)
			this.addComponent(Mesh, new Box(canvas.width, 5));
		else
			this.addComponent(Mesh, new Box(5, canvas.height));
	}
}

class System{
	execute(entities){}
}

class RenderSystem extends System{
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

class MovementSystem extends System{
	execute(entities){
		entities.forEach(entity => {
			const phys = entity.getComponent(Physics);
			if (phys){
				entity.position.x += phys.velocity.x;
				entity.position.y += phys.velocity.y;
			}
		});
	}
}

class CollisionSystem extends System{
	execute(entities){
		entities.forEach(ent => {
			if (ent.hasComponent(Physics)){
				const entMesh = ent.getComponent(Mesh);
				entities.forEach(other => {
					if (ent != other){
						const otherMesh = other.getComponent(Mesh);
						let ab = ent.position.sub(other.position);
						let smallestDist = Math.max(Math.max(entMesh.width, entMesh.height), Math.max(otherMesh.width, otherMesh.height));
						if (ab.length() < smallestDist){
							let oClosest = otherMesh.getClosestPoint(other, ent.position);
							let sClosest = entMesh.getClosestPoint(ent, oClosest);
							if (oClosest.sub(sClosest).dot(ab) > 0){
								ent.onCollision(other, sClosest);
								other.onCollision(ent, oClosest);
							}
						}
					}
				});
			}
		});
	}
}

class Game{
	constructor(){
		this.entities = [];
		this.systems = [];
	}

	addEntity(ent){
		this.entities.push(ent);
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

function drawLine(p1, p2){
	ctx.beginPath();
	ctx.moveTo(p1.x, p1.y);
	let mid = p2.sub(p1);
	let len = mid.length();
	mid.scale(0.5);
	mid = p1.add(mid);
	ctx.fillText(len, mid.x, mid.y);
	ctx.lineTo(p2.x, p2.y);
	ctx.closePath();
	ctx.fillRect(p2.x, p2.y, 5, 5);
	ctx.stroke();
}


let game = new Game();

game.addSystem(new RenderSystem());
game.addSystem(new CollisionSystem());
game.addSystem(new MovementSystem());

let a = new Player(canvas.width * 0.1, canvas.height * 0.5);
let b = new Player(canvas.width * 0.9, canvas.height * 0.5);
b.keyBinds.up = 'ArrowLeft';
b.keyBinds.down = 'ArrowRight';
let c = new Ball(/* canvas.width * 0.1 + 50, canvas.height * 0.2 */);
game.addEntity(a);
game.addEntity(b);
game.addEntity(c);

let wallt = new Wall(canvas.width / 2, 0, true);
let wallb = new Wall(canvas.width / 2, canvas.height, true);
let walll = new Wall(0, canvas.height / 2);	
let wallr = new Wall(canvas.width, canvas.height / 2);
game.addEntity(wallt);
game.addEntity(wallb);
game.addEntity(walll);
game.addEntity(wallr);


setInterval(function() {
	game.update();
}, 10);

// let players = 3;
// let rotStep = 360 / players;
// const cent = new Vector(canvas.width/2, canvas.height/2);
// let ls1 = new Vector(0, -(canvas.height / 2));
// let ls2 = new Vector(0, -(canvas.height / 2));
// ls2.rotate(rotStep);

// for (let index = 0; index < players; index++) {
// 	let p1 = ls1.add(cent);
// 	let p2 = ls2.add(cent);
// 	ctx.fillRect(p1.x, p1.y, 5, 5);
// 	ctx.fillRect(p2.x, p2.y, 5, 5);
// 	ctx.beginPath();
// 	ctx.moveTo(p1.x, p1.y);
// 	ctx.lineTo(p2.x, p2.y);
// 	ctx.stroke();
// 	ctx.closePath();
// 	ls1.rotate(rotStep);
// 	ls2.rotate(rotStep);
// }
