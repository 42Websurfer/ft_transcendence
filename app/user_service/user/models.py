from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AbstractUser
from django_enumfield import enum

User = get_user_model()

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    is_third_party_user = models.BooleanField(default=False)  # Feld hinzufügen
    otp_secret = models.CharField(max_length=32, blank=True, null=True)  # OTP-Secret speichern
    verified_2fa=models.BooleanField(default=False)
    enabled_2fa=models.BooleanField(default=False)
    def __str__(self):
        return self.user.username

class FriendshipStatus(enum.Enum):
    PENDING = 0
    ACCEPTED = 1
    BLOCKED = 2

class Friendship(models.Model):
    user = models.ForeignKey(User, related_name='sent_requests', on_delete=models.CASCADE)
    friend = models.ForeignKey(User, related_name='received_requests', on_delete=models.CASCADE)
    status = enum.EnumField(FriendshipStatus, default=FriendshipStatus.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together=('user', 'friend')

    def __str__(self):
        return f"{self.user.username} -> {self.friend.username} ({self.status})"
