from django.http import JsonResponse
import random
import string
import redis
import json
from django.contrib.auth import get_user_model
from .utils import tournament_string, round_completed
from asgiref.sync import sync_to_async
from django.views.decorators.csrf import csrf_exempt


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
		return(JsonResponse({'type': 'Error: Lobby does not exist.'}))

async def start_group_tournament(request, lobby_id):
	results = json.loads(redis.get(lobby_id))
	if (len(results) % 2 != 0):
		results.append({'user_id': -1})

	num_rounds = len(results) - 1
	num_matches_per_round = len(results) // 2

	tournament_dict = {'tournament_id': lobby_id, 'matches': []}
	match_id = 1
	for round in range(num_rounds):
		for match in range(num_matches_per_round):
			home = (round + match) % (len(results) - 1)
			away = (len(results) - 1 - match + round) % (len(results) - 1)
			if match == 0:
				away = len(results) - 1
			if (results[home]['user_id'] == -1 or results[away]['user_id'] == -1): 
				continue
			new_match = {
				'match_id': match_id,
				'round': round,
				'home': results[home]['user_id'],
				'away': results[away]['user_id'],
				'player_home': results[home]['player'],
				'player_away': results[away]['player'],
				'score_home': 0,
				'score_away': 0,
				'status': 'pending',
			}
			match_id += 1
			tournament_dict['matches'].append(new_match)
	tournament_json = json.dumps(tournament_dict)
	redis.set(tournament_string(lobby_id), tournament_json)
	
	return (JsonResponse(tournament_dict))

@csrf_exempt
def set_match(request):
	data = json.loads(request.body)		
	tournament_id = data.get('tournament_id')
	match_id = data.get('match_id')
	score_home = data.get('score_home')
	score_away = data.get('score_away')
	
	tournament = redis.get(tournament_string(tournament_id))
	if tournament is None:
		return JsonResponse({'error': 'Tournament not found'})
	tournament_dic = json.loads(tournament)
	match = tournament_dic['matches'][match_id - 1]

	print(f"match: {match}")
	match['score_home'] = score_home
	match['score_away'] = score_away
	match['status'] = 'completed'
	redis.set(tournament_string(tournament_id), json.dumps(tournament_dic))
	return JsonResponse(tournament_dic)

def check_round_completion(request, lobby_id, round):
	tournament = redis.get(tournament_string(lobby_id))

	tournament = json.loads(tournament)
	matches = tournament['matches']
	if round_completed(matches, round):
		return JsonResponse({'type': 'Round is completed'})
	else:
		return JsonResponse({'type': 'Round is NOT completed'})
