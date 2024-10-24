import math

G_ID = 0

class Vector:
	def __init__(self, x, y):
		self.x = x
		self.y = y

	def dup(self):
		return Vector(self.x, self.y)

	def add(self, other_vector):
		return Vector(self.x + other_vector.x, self.y + other_vector.y)

	def sub(self, other_vector):
		return Vector(self.x - other_vector.x, self.y - other_vector.y)

	def normalize(self):
		length = math.sqrt(self.x**2 + self.y**2)
		if length != 0:
			self.x /= length
			self.y /= length
		return self

	def scale(self, size):
		self.x *= size
		self.y *= size
		return self

	def rotate(self, degree):
		radians = degree * (math.pi / 180)
		cos = math.cos(radians)
		sin = math.sin(radians)
		new_x = self.x * cos - self.y * sin
		new_y = self.x * sin + self.y * cos
		self.x = new_x
		self.y = new_y
		return self

	def dot(self, other):
		return self.x * other.x + self.y * other.y

	def sqr_length(self):
		return self.x**2 + self.y**2

	def length(self):
		return math.sqrt(self.sqr_length())

class Plane:
	def __init__(self, start, dir):
		self.start = start.dup()
		self.dir = dir.dup()

	def rotate(self, deg):
		self.dir.rotate(deg)
		return self

	def get_tangent(self):
		return Plane(self.start, self.dir.dup().rotate(90))

	def get_closest_point(self, point):
		norm_dir = self.dir.dup().normalize()
		v = point.sub(self.start)
		t = v.dot(norm_dir)
		t = max(0, min(t, self.dir.dot(norm_dir)))
		cp = self.start.add(norm_dir.scale(t))
		return cp

class Transform:
	def __init__(self, pos_x, pos_y, rotation=0):
		self.position = Vector(pos_x, pos_y)
		self.rotation = rotation
		self.up = Vector(0, -1)
		self.up.rotate(rotation)

	def rotate(self, deg):
		self.up.rotate(deg - self.rotation)
		self.rotation = deg

	def move(self, x_add, y_add):
		self.position.x += x_add
		self.position.y += y_add
	
	def set_pos(self, x, y):
		self.position.x = x
		self.position.y = y
	
	def serialize(self):
		return ({
			'position':
			{
				'x': self.position.x,
				'y': self.position.y
			},
			'rotation': self.rotation
		})

class Component:
	def __init__(self):
		pass

class Physics(Component):
	def __init__(self, x=0, y=0, is_static=False, has_gravity=True):
		super().__init__()
		self.has_gravity = has_gravity
		self.is_static = is_static
		self.velocity = Vector(x, y)

	def set_velocity(self, dx, dy):
		self.velocity.x = dx
		self.velocity.y = dy

	def set_velocity_v(self, vec):
		self.velocity = vec

class Mesh(Component):
	def __init__(self, is_trigger=False):
		super().__init__()
		self.is_trigger = is_trigger
		self.points = []

	def get_closest_point(self, transform, point):
		closest_point = None
		smallest_dist = float('inf')

		transformed_points = [p.dup().rotate(transform.rotation).add(transform.position) for p in self.points]
		
		for i in range(len(transformed_points)):
			point_a = transformed_points[i]
			point_b = transformed_points[(i + 1) % len(transformed_points)]

			plane_ab = Plane(point_a, point_b.sub(point_a))

			curr_point = plane_ab.get_closest_point(point)
			line = curr_point.sub(point)
			dist = line.sqr_length()
			
			if dist < smallest_dist:
				smallest_dist = dist
				closest_point = curr_point
		return closest_point

class Circle(Mesh):
	def __init__(self, width, is_trigger=False):
		super().__init__(is_trigger)
		self.width = self.height = width

	def get_closest_point(self, transform, point):
		closest_point = point.sub(transform.position)
		closest_point.normalize()
		closest_point.scale(self.width * 0.5)
		closest_point = closest_point.add(transform.position)
		return closest_point

class Box(Mesh):
	def __init__(self, w, h, is_trigger=False):
		super().__init__(is_trigger)
		self.width = w
		self.height = h
		self.points.extend([
			Vector(-(self.width * 0.5), self.height * 0.5),
			Vector(self.width * 0.5, self.height * 0.5),
			Vector(self.width * 0.5, -(self.height * 0.5)),
			Vector(-(self.width * 0.5), -(self.height * 0.5))
		])

class Entity(Transform):
	def __init__(self, x, y):
		super().__init__(x, y)
		global G_ID
		self.id = G_ID + 1
		G_ID += 1
		self.components = {}

	def on_collision(self, other, collision_point=None):
		pass

	def on_trigger(self, other, collision_point=None):
		pass

	def add_component(self, component_type, component):
		self.components[component_type] = component

	def get_component(self, component_type):
		return self.components.get(component_type)

	def has_component(self, component_type):
		return component_type in self.components
	
	def update(self):
		pass

class System:
	def execute(self, entities):
		pass

class MovementSystem(System):
	def execute(self, entities):
		for entity in entities:
			phys = entity.get_component(Physics)
			if phys:
				if phys.has_gravity:
					phys.set_velocity(phys.velocity.x, phys.velocity.y + 0.0981)
				entity.move(phys.velocity.x, phys.velocity.y)

class CollisionSystem(System):
	def execute(self, entities):
		for current_ent in entities:
			ent_mesh = current_ent.get_component(Mesh)
			if not ent_mesh:
				continue
			for other_ent in entities:
				if current_ent != other_ent:
					other_mesh = other_ent.get_component(Mesh)
					if not other_mesh:
						continue
					ab = other_ent.position.sub(current_ent.position)
					threshold = max(max(ent_mesh.width, ent_mesh.height), max(other_mesh.width, other_mesh.height))
					if ab.length() < threshold:
						o_closest = other_mesh.get_closest_point(other_ent, current_ent.position)
						s_closest = ent_mesh.get_closest_point(current_ent, o_closest)
						diff = o_closest.sub(s_closest)
						if diff.dot(ab) < 0:
							phys = current_ent.get_component(Physics)
							o_phys = other_ent.get_component(Physics)
							if phys and not phys.is_static:
								current_ent.move(diff.x, diff.y)
							if o_phys and not o_phys.is_static:
								other_ent.move(-diff.x, -diff.y)
							if ent_mesh.is_trigger:
								current_ent.on_trigger(other_ent, s_closest)
							else:
								current_ent.on_collision(other_ent, s_closest)
							if other_mesh.is_trigger:
								other_ent.on_trigger(current_ent, o_closest)
							else:
								other_ent.on_collision(current_ent, o_closest)


class World:
	def __init__(self):
		self.entities = []
		self.systems = []

	def addEntity(self, ent):
		self.entities.append(ent)

	def removeEntity(self, ent):
		self.entities.remove(ent)

	def addSystem(self, sys):
		self.systems.append(sys)

	def update(self):
		for sys in self.systems:
			sys.execute(self.entities)
		
		for ent in self.entities:
			ent.update()
