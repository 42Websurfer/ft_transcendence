def tournament_string(lobby_id):
	return (f"tournament_{lobby_id}")

def round_completed(matches, round):
	for match in matches:
		if match['round'] > round:
			return True
		elif match['status'] != 'completed':
			return False
	return True

def create_user_structure(user_id, role):
	user_data = {
		'ranking': 1,
		'user_id': user_id,
		'games': 0,
		'wins': 0,
		'loses': 0,
		'goals': 0,
		'goals_against': 0,
		'difference': 0,
		'points': 0,
		'role': role,
	}
	return user_data