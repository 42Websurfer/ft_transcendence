import redis
import json
from channels.layers import get_channel_layer
from asgiref.sync import sync_to_async, async_to_sync
from django.core.exceptions import ObjectDoesNotExist
from .models import OnlineMatch, GameStatsUser, Tournament, TournamentResults 
import requests

redis = redis.Redis(host='redis', port=6379, db=0)

def tournament_string(lobby_id):
	return (f"tournament_{lobby_id}")

def match_lobby_string(lobby_id):
	return (f"match_{lobby_id}")

def multiple_lobby_string(lobby_id):
	return (f"multiple_{lobby_id}")

def round_completed(matches, round):
	for match in matches:
		if (int)(match['round']) > round:
			return True, False
		elif match['status'] == 'pending' or match['status'] == 'running':
			return False, False
	return True, True

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
		'status': 'connected'
	}
	return user_data

def sort_group_tournament(results):
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
	connected_users = [user for user in sorted_result if user['status'] != 'disconnected']
	disconnected_users = [user for user in sorted_result if user['status'] == 'disconnected']
	sorted_result = connected_users + disconnected_users	
	
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
	return sorted_result

async def update_tournament_group(lobby_id, match_data):
	home = match_data['home']
	away = match_data['away']
	score_home = match_data['score_home']
	score_away  = match_data['score_away']
	results_json = redis.get(lobby_id)
	if not results_json:
		return
	results = json.loads(results_json)
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
			user['games'] += 1
		elif user['user_id'] == away:
			user['goals'] += score_away
			user['goals_against'] += score_home
			if (home_winner):
				user['lost'] += 1
			else:
				user['won'] += 1
				user['points'] += 3
			user['diff'] += (score_away - score_home)
			user['games'] += 1
	
	sorted_result = sort_group_tournament(results)

	redis.set(lobby_id, json.dumps(sorted_result))
	channel_layer = get_channel_layer()
	await channel_layer.group_send(
		lobby_id,
		{
			'type': 'send_tournament_users',
		}
	)

async def update_online_match_socket(data, lobby_id):
	lobby_data_json = redis.get(match_lobby_string(lobby_id))
	if (lobby_data_json):
		lobby = json.loads(lobby_data_json)
		match = {
			'player_home': data.get('home').username,
			'player_away': data.get('away').username,
			'score_home': data.get('home_score'),
			'score_away': data.get('away_score')
		}
		lobby['matches'].append(match)
		redis.set(match_lobby_string(lobby_id), json.dumps(lobby))
		channel_layer = get_channel_layer()	
		await channel_layer.group_send(
			match_lobby_string(lobby_id),
			{
				'type': 'send_online_match_list',
			}
		)

def set_online_match(data, lobby_id):
	if (data.get('home_score') > data.get('away_score')):
		data['winner'] = data.get('home')
	else:
		data['winner'] = data.get('away')
	
	match = OnlineMatch(
		home = data.get('home'),
		away = data.get('away'),
		home_score = data.get('home_score'),
		away_score = data.get('away_score'),
		modus = 'match' #vllt noch setzen welcher type!
	)
	match.save()
	(async_to_sync)(update_online_match_socket)(data, lobby_id)


def safe_tournament_data(lobby_id):
	results_json = redis.get(lobby_id)
	if not results_json:
		return
	results = json.loads(results_json)
	connected = 0
	for result in results: 
		if result['status'] == 'connected':
			connected += 1
	if (connected < 2):
		return
	tournament = Tournament(tournament_id=lobby_id)
	tournament.save()
	for result in results: 
		try:
			user_Gamestats = GameStatsUser.objects.get(username=result['player'])
		except ObjectDoesNotExist:
			continue
		if result['status'] != 'disconnected':
			if result['rank'] == 1:
				user_Gamestats.tournament_wins += 1
				user_Gamestats.save()
				try:
					requests.post('http://blockchain:5000/update_user_score', json={'userId': user_Gamestats.user_id, 'newScore': user_Gamestats.tournament_wins})
				except:
					pass
			tournament_result = TournamentResults(
				tournament_id = tournament,
				rank = result['rank'],
				games = result['games'],
				won = result['won'],
				lost = result['lost'],
				goals_for = result['goals'],
				goals_against = result['goals_against'],
				diff = result['diff'],
				points = result['points'],
				user = user_Gamestats,
			)
			tournament_result.save()
		
	tournament_json = redis.get(tournament_string(lobby_id))
	if not tournament_json:
		return
	tournament = json.loads(tournament_json)
	matches = tournament['matches']
	for match in matches:
		try:
			home_user = GameStatsUser.objects.get(username=match['player_home'])
			away_user = GameStatsUser.objects.get(username=match['player_away'])
		except ObjectDoesNotExist:
			continue
		if (match['status'] == 'finished'):
			online_match = OnlineMatch(
				home = home_user,
				away = away_user,
				home_score = match['score_home'],
				away_score = match['score_away'],
				modus = 'RoundRobin',
			)
			online_match.save()

		#need to delete redis database!!. and set everything to finish!


	#tournament = 
	#1. safe tournament_id in Tournament object
	#2. Tournament_results!

def set_winner_multiple(lobby_id, winner_name):
	data = redis.get(multiple_lobby_string(lobby_id))
	if data is None:
		return
	data = json.loads(data)
	data['winners'].append(winner_name)
	redis.set(multiple_lobby_string(lobby_id), json.dumps(data))

async def set_match_data(lobby_id, match_id, score_home, score_away, status):
	tournament = redis.get(tournament_string(lobby_id))
	if tournament is None:
		return False
	tournament_dic = json.loads(tournament)
	match = tournament_dic['matches'][match_id - 1]
	round = tournament_dic['current_round']
	match['score_home'] = score_home
	match['score_away'] = score_away
	match['status'] = status
	redis.set(tournament_string(lobby_id), json.dumps(tournament_dic))
	if (status == 'finished' and not (score_home == 0 and score_away == 0)):
		await update_tournament_group(lobby_id, match)
	channel_layer = get_channel_layer()
	await channel_layer.group_send(
		lobby_id,
		{
			'type': 'match_list',
		}
	)
	status, tournament_finished = round_completed(tournament_dic['matches'], round)
	if status and not tournament_finished:
		await channel_layer.group_send(
			lobby_id,
			{
				'type': 'send_round_completed'
			}
		)
	elif status and tournament_finished:
		await channel_layer.group_send(
			lobby_id,
			{
				'type': 'send_tournament_finished',
			}
		)
		await (sync_to_async)(safe_tournament_data)(lobby_id)
	return True

def reset_match(lobby_id, match):
	home = match['home']
	away = match['away']
	score_home = match['score_home']
	score_away  = match['score_away']
	results_json = redis.get(lobby_id)
	if not results_json:
		return
	results = json.loads(results_json)
	home_winner = False
	if (score_home > score_away):
		home_winner = True
	for user in results:
		if user['user_id'] == home:
			user['goals'] -= score_home
			user['goals_against'] -= score_away
			if (home_winner):
				user['won'] -= 1
				user['points'] -= 3
			else:
				user['lost'] -= 1
			user['games'] -= 1
			user['diff'] -= (score_home - score_away)
		elif user['user_id'] == away:
			user['goals'] -= score_away
			user['goals_against'] -= score_home
			if (home_winner):
				user['lost'] -= 1
			else:
				user['won'] -= 1
				user['points'] -= 3
			user['games'] -= 1
			user['diff'] -= (score_away - score_home)
	results = sort_group_tournament(results)
	redis.set(lobby_id, json.dumps(results))

async def update_match(lobby_id, match):
	if (match['status'] == 'freegame' or match['status'] == 'disconnected'):
		return
	if match['status'] == 'finished':
		reset_match(lobby_id, match)
	await set_match_data(lobby_id, match['match_id'], 0, 0, 'disconnected')


async def update_matches_disconnect(user_id, lobby_id):
	matches_json = redis.get(tournament_string(lobby_id))
	if not matches_json:
		return 
	matches = json.loads(matches_json)
	if not matches:
		return
	for match in matches['matches']:
		if (match['home'] == user_id):
			await update_match(lobby_id, match)
		elif (match['away'] == user_id):
			await update_match(lobby_id, match)

	#for loop durch alle Spieler die disconnected werden
	#checken die vorherigen Spiele, falls schon welche gespielt worden sind dann natürlich die als erster rauslöschen aus Standing und überschreiben mit der 0:7
	# dann standing aktualisieren
	# dann standing und matches erneut senden.

def get_longest_winstreak(form):
	
	current = 0
	highest = 0

	for item in form:
		if (item == 'W'):
			current += 1
			if (current > highest):
				highest = current 
		if (item == "L"):
			current = 0

	return (highest)
