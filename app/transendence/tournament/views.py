from django.http import JsonResponse
import random
import string
import redis

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
