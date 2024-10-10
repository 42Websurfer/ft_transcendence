
def change_admin(redis, group_name):
	members = redis.hgetall(group_name)
	if members:
		new_admin = next(iter(members))
		redis.hset(group_name, new_admin, 'admin')

def tournament_string(lobby_id):
	return (f"tournament_{lobby_id}")

def round_completed(matches, round):
	for match in matches:
		if match['round'] > round:
			return True
		elif match['status'] != 'completed':
			return False
	return True