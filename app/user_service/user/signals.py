from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import UserProfile
import requests
import json
#from tournament.models import GameStatsUser

User = get_user_model()

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)
        data = {
            'user_id': instance.pk,
            'username': instance.username,
        }
        try:
            response = requests.post('http://development:8000/tm/gameStatsUser/', json=data)
            if response.status_code != 200: 
                data = response.json()
                print(data.get('message'))
        except Exception as e: 
            print(e)
 #       GameStatsUser.objects.create(user=instance)

def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()

@receiver(pre_save, sender=User)
def update_gamestatsuser(sender, instance, **kwargs):
    if instance.pk:
        try:
            old_user = User.objects.get(pk=instance.pk)
            if old_user.username != instance.username:
                data = {
                    'user_id': instance.pk,
                    'username': instance.username
                }
                response = requests.put('http://development:8000/tm/gameStatsUser/', json=data)

                if response.status_code != 200:
                    print('Failed to update GameStatsUser')
        except User.DoesNotExist:
            pass
