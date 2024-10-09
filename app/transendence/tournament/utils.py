
def change_admin(redis, group_name):
	members = redis.hgetall(group_name)
	if members:
		new_admin = next(iter(members))
		redis.hset(group_name, new_admin, 'admin')
