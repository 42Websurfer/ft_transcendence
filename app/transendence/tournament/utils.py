def tournament_string(lobby_id):
	return (f"tournament_{lobby_id}")

def round_completed(matches, round):
	for match in matches:
		if match['round'] > round:
			return True
		elif match['status'] != 'completed':
			return False
	return True

def create_user_structure(user_id, role, username):
	user_data = {
		'rank': 1,
		'user_id': user_id,
		'games': 0,
		'won': 0,
		'lost': 0,
		'goals': 0,
		'goals_against': 0,
		'diff': 0,
		'points': 0,
		'role': role,
		'username': username,
	}
	return user_data

def update_tournament_group(match_data):
	home = match_data['home']
	away = match_data['away']
	score_home = match_data['score_home']
	score_away  = match_data['score_away']
