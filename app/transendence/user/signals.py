from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import UserProfile
from tournament.models import GameStatsUser

User = get_user_model()

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)
        GameStatsUser.objects.create(user=instance)

@receiver(pre_save, sender=User)
def update_gamestatsuser(sender, instance, **kwargs):
    if instance.pk:
        try:
            old_user = User.objects.get(pk=instance.pk)
            if old_user.username != instance.username:
                gamestatsuser = GameStatsUser.objects.get(user=instance)
                gamestatsuser.username = instance.username
                gamestatsuser.save()
        except User.DoesNotExist:
            pass
        except GameStatsUser.DoesNotExist:
            pass