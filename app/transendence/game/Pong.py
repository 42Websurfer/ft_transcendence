import threading, time

from typing import List, Dict, Tuple
from .GameSystem import *

# Constants
PLAYER_MOVE_SPEED = 20
CANVAS_WIDTH = 1920
CANVAS_HIEGHT = 1080

class Ball(Entity):
	def __init__(self, x=CANVAS_WIDTH // 2, y=CANVAS_HIEGHT // 2):
		super().__init__(x, y)
		self.add_component(Mesh, Circle(40))
		self.physics = Physics(0, 0, False, False)
		self.add_component(Physics, self.physics)
		self.last_hit = None

	def move(self, x_add, y_add):
		new_pos = self.position.add(Vector(x_add, y_add))
		self.position = new_pos

	def on_collision(self, other, collision_point=None):
		if isinstance(other, Player):
			self.last_hit = other
		if collision_point is None:
			return
		ba = self.position.sub(collision_point)
		ba.normalize()
		tangent = Plane(collision_point, ba)
		velocity_normalized = self.physics.velocity.dup().normalize()
		dot_product = tangent.dir.dot(velocity_normalized)
		reflection = velocity_normalized.dup().sub(ba.scale(2 * dot_product))
		reflection.scale(self.physics.velocity.length())
		self.physics.set_velocity(reflection)

class Player(Entity):
	def __init__(self, x, y, length=250):
		super().__init__(x, y)
		self.mesh = Box(25, length)
		self.physics = Physics(0, 0, True, False)
		self.add_component(Mesh, self.mesh)
		self.add_component(Physics, self.physics)
		self.score = 0
		self.start_pos = None
		self.goal_height = 0

	def move(self, x_add, y_add):
		new_pos = self.position.add(Vector(x_add, y_add))

		# Check if the new player position is still in range of its goal
		if self.start_pos is not None:
			ab = new_pos - self.start_pos
			ab.scale((ab.length() + self.mesh.height * 0.5) / ab.length())
			if ab.length() > self.goal_height * 0.5:
				return

		# Check if the mesh is still inside the canvas
		transformed_points = [p.dup().rotate(self.rotation).add(new_pos) for p in self.mesh.points]
		for point in transformed_points:
			if point.x < 0 or point.y > CANVAS_WIDTH:
				return
			if point.x < 0 or point.y > CANVAS_HIEGHT:
				return
		self.position = new_pos

	def on_collision(self, other, collision_point=None):
		ophys = other.get_component(Physics)
		if ophys and collision_point and isinstance(other, Ball):
			drall = collision_point.sub(self.position)
			prev_scale = ophys.velocity.length()
			drall.normalize()
			drall.scale(10)
			ophys.velocity = ophys.velocity.add(drall)
			ophys.velocity.normalize()
			ophys.velocity.scale(prev_scale)

class Wall(Entity):
	def __init__(self, x, y, rot, height):
		super().__init__(x, y)
		self.height = height
		self.mesh = Box(10, height, True)
		self.rotate(rot)
		self.components.append(self.mesh)


world = World()
world.addSystem(CollisionSystem())
world.addSystem(MovementSystem())

def game_loop():
	while True:
		world.update()
		time.sleep(0.01)

game_thread = threading.Thread(target=game_loop)
game_thread.start()
