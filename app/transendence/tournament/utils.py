import redis
import json
from channels.layers import get_channel_layer

from asgiref.sync import async_to_sync

redis = redis.Redis(host='redis', port=6379, db=0)

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
		'player': username,
	}
	return user_data

def update_tournament_group(lobby_id, match_data):
	home = match_data['home']
	away = match_data['away']
	score_home = match_data['score_home']
	score_away  = match_data['score_away']
	results = json.loads(redis.get(lobby_id))
	home_winner = False
	if (score_home > score_away):
		home_winner = True
	for user in results:
		if user['user_id'] == home:
			user['goals'] += score_home
			user['goals_against'] += score_away
			if (home_winner):
				user['won'] += 1
				user['points'] += 3
			else:
				user['lost'] += 1
			user['diff'] += (score_home - score_away)
		elif user['user_id'] == away:
			user['goals'] += score_away
			user['goals_against'] += score_home
			if (home_winner):
				user['lost'] += 1
			else:
				user['won'] += 1
				user['points'] += 3
			user['diff'] += (score_away - score_home)
	
	sorted_result = sorted(
	results,
	key=lambda x: (
		x['points'],
		x['diff'],
		x['won'],
		x['goals']
	),
	reverse=True
	)
	
	idx = 0
	while (idx < len(sorted_result)):
		sorted_result[idx]['rank'] = idx + 1
		if (idx > 0):
			if sorted_result[idx]['points'] == sorted_result[idx - 1]['points'] and \
				sorted_result[idx]['diff'] == sorted_result[idx - 1]['diff'] and \
				sorted_result[idx]['won'] == sorted_result[idx - 1]['won'] and \
				sorted_result[idx]['goals'] == sorted_result[idx - 1]['goals']:
					sorted_result[idx]['rank'] = sorted_result[idx - 1]['rank']	
		idx += 1

	redis.set(lobby_id, json.dumps(sorted_result))
	channel_layer = get_channel_layer()
	async_to_sync(channel_layer.group_send)(
		lobby_id,
		{
			'type': 'send_tournament_users',
		}
	)