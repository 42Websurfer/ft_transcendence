from django.http import JsonResponse
import random
import string
import redis
import json
import sys
from .utils import tournament_string, round_completed, update_tournament_group
from django.views.decorators.csrf import csrf_exempt
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync



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
		return(JsonResponse({'type': 'error', 'message': 'Lobby does not exist.'}))

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
			new_match = {
				'match_id': match_id,
				'round': round + 1,
				'score_home': 0,
				'score_away': 0,
				'status': 'pending',
			}
			if results[home]['user_id'] == -1: 
				new_match['player_home'] = 'Free from play',
				new_match['home'] = -1,
				new_match['player_away'] = results[away]['player'],
				new_match['away'] = results[away]['user_id'],
			elif results[away]['user_id'] == -1:
				new_match['player_home'] = results[home]['player'],
				new_match['home'] = results[home]['user_id'],
				new_match['player_away'] = 'Free from play',
				new_match['away'] = -1,
			else:
				new_match['player_home'] = results[home]['player'],
				new_match['home'] = results[home]['user_id'],
				new_match['player_away'] = results[away]['player'],
				new_match['away'] = results[away]['user_id'],		
			match_id += 1
			tournament_dict['matches'].append(new_match)
	tournament_json = json.dumps(tournament_dict)
	redis.set(tournament_string(lobby_id), tournament_json)
	channel_layer = get_channel_layer()
	await channel_layer.group_send(
		lobby_id,
		{
			'type': 'match_list',
		}
	)
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

	match['score_home'] = score_home
	match['score_away'] = score_away
	match['status'] = 'completed'
	redis.set(tournament_string(tournament_id), json.dumps(tournament_dic))
	update_tournament_group(tournament_id, match)
	channel_layer = get_channel_layer()
	async_to_sync(channel_layer.group_send)(
		tournament_id,
		{
			'type': 'match_list',
		}
	)
	return JsonResponse(tournament_dic)

def check_round_completion(request, lobby_id, round):
	tournament = redis.get(tournament_string(lobby_id))

	tournament = json.loads(tournament)
	matches = tournament['matches']
	if round_completed(matches, round):
		return JsonResponse({'type': 'Round is completed'})
	else:
		return JsonResponse({'type': 'Round is NOT completed'})
