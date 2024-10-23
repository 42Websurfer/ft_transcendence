from django.http import JsonResponse
import random
import string
import redis
import json
import requests
import sys
import logging
from .utils import update_online_match_socket, set_online_match, tournament_string, round_completed, update_tournament_group, set_match_data, match_lobby_string
from django.views.decorators.csrf import csrf_exempt
from channels.layers import get_channel_layer
from asgiref.sync import sync_to_async
from .models import GameStatsUser

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
        lobby_data = json.loads(redis.get(match_lobby_string(lobby_id)))
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


def check_round_completion(request, lobby_id, round):
    tournament = redis.get(tournament_string(lobby_id))

    tournament = json.loads(tournament)
    matches = tournament['matches']
    if round_completed(matches, round):
        return JsonResponse({'type': 'Round is completed'})
    else:
        return JsonResponse({'type': 'Round is NOT completed'})


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