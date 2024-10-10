from django.http import JsonResponse
import random
import string
import redis
import json
from .utils import tournament_string

redis = redis.Redis(host='redis', port=6379, db=0)

def lobby_name_generator():
	return ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(4))


def create_lobby(request):
	user = request.user
	lobby_id = lobby_name_generator()
	print (lobby_id)
	return JsonResponse({
		'lobby': {
			'id': lobby_id,
			'role': 'admin',
		}
	})

def join_lobby(request, lobby_id):
	if redis.exists(lobby_id):
		return(JsonResponse({'type': 'success'}))
	else: 
		return(JsonResponse({'type': 'error'}))

def start_group_tournament(request, lobby_id):
	players_id = redis.hgetall(lobby_id)
	players_id = [
		int(user)
		for user in players_id.keys()
	]
	if (len(players_id) % 2 != 0):
		players_id.append(-1)
	
	user_data = [
		{
			'id': players_id
		}
		for i in range(len(players_id))
	]
	print(players_id)
	matchList = []
	num_rounds = len(players_id) - 1
	num_matches_per_round = len(players_id) // 2

	tournament_dict = {'tournament_id': lobby_id, 'matches': []}
	match_id = 1
	for round in range(num_rounds):
		round_matches = []
		for match in range(num_matches_per_round):
			home = (round + match) % (len(players_id) - 1)
			away = (len(players_id) - 1 - match + round) % (len(players_id) - 1)
			if match == 0:
				away = len(players_id) - 1
			if (players_id[home] == -1 or players_id[away] == -1): 
				continue
			new_match = {
				'match_id': match_id,
				'round': round,
				'home': players_id[home],
				'away': players_id[away],
				'score_home': 0,
				'score_away': 0,
				'status': 'pending',
			}
			match_id += 1
			tournament_dict['matches'].append(new_match)
			round_matches.append((players_id[home], players_id[away]))
		matchList.extend(round_matches)
		tournament_json = json.dumps(tournament_dict)
		redis.set(tournament_string(lobby_id), tournament_json)
	return (JsonResponse(tournament_dict))
	# 


#nach der pause mal die funktion laufen lassen! und schauen ob das alles funktioniert! 
