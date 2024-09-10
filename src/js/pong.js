const canvas = document.createElement('canvas');
canvas.width = 1280;
canvas.height = 720;
const ctx = canvas.getContext('2d');
const PLAYER_MOVE_SPEED = 10;

var entities = [];
var pents = [];

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

	add(otherVector){
		return (new Vector(this.x + otherVector.x, this.y + otherVector.y));
	}

	sub(otherVec){
		return (new Vector(this.x - otherVec.x, this.y - otherVec.y));
	}

	scale(size){
		this.x *= size;
		this.y *= size;
	}

    rotate(degree) {
        const radians = degree * (Math.PI / 180);

        const cos = Math.cos(radians);
        const sin = Math.sin(radians);

        const newX = this.x * cos - this.y * sin;
        const newY = this.x * sin + this.y * cos;

        this.x = newX;
        this.y = newY;
    }

	sqrLength(){
		return (Math.pow(this.x, 2) + Math.pow(this.y, 2));
	}

	length(){
		return (Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2)));
	}

}

class Transform{
	constructor(posX, posY, rotation = 0){
		this.position = new Vector(posX, posY);
		this.rotation = rotation;
	}
}

class Mesh extends Transform{
	constructor(x, y){
		super(x, y);
		this.up = new Vector(0, -1);
		this.points = [];
	}

	rotateMesh(deg){
		for (const p of this.points) {
			p.rotate(deg);
		}
		this.up.rotate(deg);
	}

	draw(){
		ctx.beginPath();
		let point = new Vector(this.points[0].x, this.points[0].y)
		// point.rotate(this.rotation);
		point = point.add(this.position);
		ctx.moveTo(point.x, point.y);
		for (let i = 1; i < this.points.length; i++) {
			point = new Vector(this.points[i].x, this.points[i].y);
			// point.rotate(this.rotation);
			point = point.add(this.position);
			ctx.lineTo(point.x, point.y);
		}
		point = new Vector(this.points[0].x, this.points[0].y)
		// point.rotate(this.rotation);
		point = point.add(this.position);
		ctx.lineTo(point.x, point.y);
		ctx.closePath();
		ctx.fill();
	}
}

class Entity{
	constructor(mesh){
		this.mesh = mesh;
		entities.push(this);
	}

	move(xAdd, yAdd){
		this.mesh.position.x += xAdd;
		this.mesh.position.y += yAdd;
	}

	update(){
		this.mesh.draw();
	}
}

class PhysEntity extends Entity{
	constructor(mesh){
		super(mesh);
		this.velocity = new Vector(0,0);
		pents.push(this);
	}

	update(){
		this.move(this.velocity.x, this.velocity.y);
		super.update();
	}
}

class Circle extends Mesh{
	constructor(x, y, width){
		super(x,y);
		this.width = this.height = width;
	}

	draw(){
		ctx.beginPath();
		ctx.arc(this.position.x, this.position.y, this.width * 0.5, 0, 360);
		ctx.closePath();
		ctx.fill();
	}
}

class Ball extends PhysEntity{
	constructor(x = canvas.width / 2, y = canvas.height / 2){
		super(new Circle(x, y, 40));
	}
}

class Box extends Mesh{
	constructor(x, y, w, h){
		super(x, y);
		this.width = w;
		this.height = h;
		this.points.push(new Vector(-(this.width * 0.5), this.height * 0.5));
		this.points.push(new Vector(this.width * 0.5, this.height * 0.5));
		this.points.push(new Vector(this.width * 0.5, -(this.height * 0.5)));
		this.points.push(new Vector(-(this.width * 0.5), -(this.height * 0.5)));
	}
}

class Player extends Entity{
	constructor(x, y){
		super(new Box(x, y, 40, 250));
		this.keyBinds = {up: 'ArrowUp', down: 'ArrowDown'};
		window.addEventListener('keydown', (event) => this.keyDown(event));
		window.addEventListener('keyup', (event) => this.keyUp(event));
		this.moveDir = new Vector(0,0);
	}

	move(xAdd, yAdd){
		let newPos = this.mesh.position.add(new Vector(xAdd, yAdd));
		for (let point of this.mesh.points) {
			point = point.add(newPos);
			if (point.x < 0 || point.x > canvas.width)
				return;
			if (point.y < 0 || point.y > canvas.height)
				return;
		}
		this.mesh.position = newPos;
	}

	update(){
		this.move(this.moveDir.x, this.moveDir.y);
		super.update();
	}

	keyDown(event){
		if (event.key === this.keyBinds.up){
			let dir = new Vector(this.mesh.up.x, this.mesh.up.y);
			dir.scale(PLAYER_MOVE_SPEED);
			this.moveDir = dir;
		}
		if (event.key === this.keyBinds.down) {
			let dir = new Vector(this.mesh.up.x, this.mesh.up.y);
			dir.scale(-PLAYER_MOVE_SPEED);
			this.moveDir = dir;
		}
	}

	keyUp(event){
		if (event.key === this.keyBinds.up || event.key === this.keyBinds.down)
			this.moveDir.x = 0; this.moveDir.y = 0;
	}
}

function drawLine(p1, p2){
	ctx.beginPath();
	ctx.moveTo(p1.x, p1.y);
	ctx.lineTo(p2.x, p2.y);
	ctx.closePath();
	ctx.stroke();
}

let a = new Player(canvas.width * 0.1, canvas.height * 0.5);
let b = new Player(canvas.width * 0.9, canvas.height * 0.5);
b.keyBinds.up = 'ArrowLeft';
b.keyBinds.down = 'ArrowRight';
let c = new Ball(/* canvas.width * 0.1 + 50, canvas.height * 0.2 */);

// let shortest = undefined;

// for (const point of a.mesh.points) {
// 	let af = point.add(a.mesh.position);
// 	let line = af.sub(b.mesh.position);
// 	if (shortest == undefined || line.sqrLength() < shortest.sqrLength())
// 		shortest = line;
// 	drawLine(af, b.mesh.position);
// }

// ctx.strokeStyle = 'green';
// drawLine(shortest, b.mesh.position);

// a.update();
// b.update();

// drawLine(a.mesh.position, b.mesh.position);


setInterval(function() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	for (const ent of entities) {
		if (ent instanceof PhysEntity)
			;//check collision??
		ent.update();
	}
}, 10);

// ctx.beginPath();
// ctx.moveTo(50, 50);
// ctx.lineTo(100, 50);
// ctx.lineTo(100, 100);
// ctx.lineTo(50, 100);
// ctx.lineTo(50, 50);
// ctx.closePath();
// ctx.fill();

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

// setInterval(function(){
// 	ctx.clearRect(0, 0, canvas.width, canvas.height);
// 	drawCourt();
// 	for (const ent of ents) {
// 		ent.update();
// 		ent.draw();
// 	}
// }, 10);
