from django.http import JsonResponse
import random
import string
import redis
import json
import requests
import sys
import logging
from .utils import get_longest_winstreak, update_online_match_socket, set_online_match, tournament_string, round_completed, update_tournament_group, set_match_data, match_lobby_string
from django.views.decorators.csrf import csrf_exempt
from channels.layers import get_channel_layer
from asgiref.sync import sync_to_async
from django.core.exceptions import ObjectDoesNotExist
from .models import GameStatsUser, OnlineMatch, Tournament, TournamentResults

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

redis = redis.Redis(host='redis', port=6379, db=0)

def lobby_name_generator():
	return ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(4))


def create_lobby(request):
	user = request.user
	lobby_id = lobby_name_generator()
	return JsonResponse({
		'lobby': {
			'id': lobby_id,
			'role': 'admin',
		}
	})

def join_match_lobby(request, lobby_id):
	user = request.user
	if (redis.exists(match_lobby_string(lobby_id))):
		lobby_data_json = redis.get(match_lobby_string(lobby_id))
		if not lobby_data_json: 
			return (JsonResponse({'type': 'error', 'message': 'No data in redis.'}))
		lobby_data = json.loads(lobby_data_json)
		member_username = str(lobby_data.get('member_username'))
		if (member_username == "" or member_username == user.username):
			return(JsonResponse({'type': 'success'}))
		else: 
			return (JsonResponse({'type': 'error', 'message': 'Lobby already full.'}))
	else: 
		return(JsonResponse({'type': 'error', 'message': 'Lobby does not exist.'}))

def join_lobby(request, lobby_id):
	if redis.exists(lobby_id):
		return(JsonResponse({'type': 'success'}))
	elif redis.exists(tournament_string(lobby_id)):
		return(JsonResponse({'type': 'error', 'message': 'Tournament already started.'}))
	else: 
		return(JsonResponse({'type': 'error', 'message': 'Lobby does not exist.'}))

async def start_group_tournament(request, lobby_id):
	results_json = redis.get(lobby_id)
	if (not results_json):
		return (JsonResponse({'type': 'error', 'message': 'No data in redis.'}))
	results = json.loads(results_json)
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
				new_match['player_home'] = 'Free from play'
				new_match['home'] = -1
				new_match['player_away'] = results[away]['player']
				new_match['away'] = results[away]['user_id']
				new_match['status'] = 'freegame'
			elif results[away]['user_id'] == -1:
				new_match['player_home'] = results[home]['player']
				new_match['home'] = results[home]['user_id']
				new_match['player_away'] = 'Free from play'
				new_match['away'] = -1
				new_match['status'] = 'freegame'
			else:
				new_match['player_home'] = results[home]['player']
				new_match['home'] = results[home]['user_id']
				new_match['player_away'] = results[away]['player']
				new_match['away'] = results[away]['user_id']
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

async def set_tournament_match(request):
	data = json.loads(request.body)
	tournament_id = data.get('tournament_id')
	match_id = data.get('match_id')
	score_home = data.get('score_home')
	score_away = data.get('score_away')
	if await set_match_data(tournament_id, match_id, score_home, score_away, 'finished'):
		return (JsonResponse({'type': 'success'}))
	else:
		return (JsonResponse({'type': 'error'}))


async def test_set_online_match(request):
	data = json.loads(request.body)

	home_username = data.get('player1')
	away_username = data.get('player2')
	lobby_id = data.get('lobby_id')
	home = await sync_to_async(GameStatsUser.objects.get)(username=home_username)
	away = await sync_to_async(GameStatsUser.objects.get)(username=away_username)
	match = {}
	match['home'] = home
	match['away'] = away
	match['home_score'] = data.get('score_player1')
	match['away_score'] = data.get('score_player2')
	await sync_to_async(set_online_match)(match, lobby_id)
	await update_online_match_socket(match, lobby_id)
	return (JsonResponse({'type': 'success'}))
		
async def start_game_loop(request, lobby_id):
	channel_layer = get_channel_layer()	
	await channel_layer.group_send(
		match_lobby_string(lobby_id),
		{
			'type': 'send_online_start_match',
		}
	)
	return (JsonResponse({'type': 'success'}))

def get_last_tournament_data(user_game_stats):
	try:
		tournaments = TournamentResults.objects.filter(user=user_game_stats).order_by('-tournament_id__date').all()

		if not tournaments:
			return None, 0
		last_tournament_result = tournaments.first()
		
		if not last_tournament_result:
			return None, 0

		last_tournament = last_tournament_result.tournament_id

		# Retrieve all results for that tournament using related_name
		tournament_results = last_tournament.all_results.all()

		# Process tournament results as needed
		results_data = []
		for result in tournament_results:
			results_data.append({
				'player': result.user.username,
				'rank': result.rank,
				'games': result.games,
				'wins': result.won,
				'losses': result.lost,
				'goals_for': result.goals_for,
				'goals_against': result.goals_against,
				'diff': result.diff,
				'points': result.points,
			})

		return (results_data, len(tournaments))

	except ObjectDoesNotExist:
		return None, 0
   

def get_match_data(user_game_stats):
	home_matches = OnlineMatch.objects.filter(home=user_game_stats)
	away_matches = OnlineMatch.objects.filter(away=user_game_stats)
	all_matches = home_matches.union(away_matches)	
	matches_data = []
	highest_win = {}
	highest_loss = {}
	form = ""	
	for match in all_matches:
		match_data = {
			'player_home': match.home.username if match.home else None,
			'player_away': match.away.username if match.away else None,
			'score_home': match.home_score,
			'score_away': match.away_score,
			#'winner': match.winner.username if match.winner else None,
			'date': match.created_at.strftime('%d-%m-%Y %H:%M'),
			'modus': match.modus,
		}
		if (match.winner == user_game_stats):
			form += ('W')
			if (match.winner == match.home): #user wins at home
				if (not highest_win or (highest_win['score_home'] - highest_win['score_away']) < (match_data['score_home'] - match_data['score_away'])):
					highest_win = match_data
			else: #(match.winner is match_data['away']): #user wins away
				if (not highest_win or (highest_win['score_away'] - highest_win['score_home']) < (match_data['score_away'] - match_data['score_home'])):
					highest_win = match_data
		else:
			form += ('L')
			if (user_game_stats == match.home):
				if (not highest_loss or (highest_loss['score_away'] - highest_loss['score_home']) < (match_data['score_away'] - match_data['score_home'])):
					highest_loss = match_data
			else:
				if (not highest_loss or (highest_loss['score_home'] - highest_loss['score_away']) < (match_data['score_home'] - match_data['score_away'])):
					highest_loss = match_data
		matches_data.append(match_data)
	return matches_data, highest_win, highest_loss, form

def get_dashboard_data(request):
	user = request.user
	try:
		user_game_stats = GameStatsUser.objects.get(username=user.username)
	except ObjectDoesNotExist:
		return JsonResponse({'type': 'error', 'message': 'User does not exist in GameStats Object'})
	logger.debug(f"user_game_stats = {user_game_stats}")

	all_matches, highest_win, highest_loss, form = get_match_data(user_game_stats)
	logger.debug(f"all_matches from the user: \n {all_matches}")
	logger.debug(f"Highest_win = {highest_win}, \nhighest_loss = {highest_loss}\nForm = {form}")
	tournament_data, tournaments_played = get_last_tournament_data(user_game_stats)
	logger.debug(f"Tournament info\n {tournament_data}")

	data = {
		'type': 'success',
		'wins': user_game_stats.wins,
		'losses': user_game_stats.losses,
		'goals_for': user_game_stats.goals_for,
		'goals_against': user_game_stats.goals_against,
		'username': user_game_stats.username,
		'tournament_wins': user_game_stats.tournament_wins,
		'form': 'WLWWLW', #muss noch gebaut werden
		'matches': all_matches,
		'last_tournament': tournament_data,
		'highest_win': highest_win,
		'highest_loss': highest_loss,
		'form': form,
		'tournaments_played': tournaments_played,
		'registered': user_game_stats.user.date_joined.strftime('%d-%m-%Y %H:%M'),
		'winstrike': get_longest_winstreak(form),
	}
	return JsonResponse(data)
	#

# BLOCKCHAIN-SERVICE

def bc_update_score(request):
	user_id = request.user.id
	data = json.loads(request.body)
	new_score = data.get('newScore')
	
	response = requests.post('http://blockchain:5000/update_user_score', json={'userId': user_id, 'newScore': new_score})
	return JsonResponse(response.json(), status=response.status_code)

def bc_get_score(request):
	user_id = request.user.id
	response = requests.get(f'http://blockchain:5000/get_user_score?userId={user_id}')
	return JsonResponse(response.json(), status=response.status_code)

def bc_delete_score(request):
	user_id = request.user.id
	
	response = requests.get(f'http://blockchain:5000/delete_user_score?userId={user_id}')
	return JsonResponse(response.json(), status=response.status_code)