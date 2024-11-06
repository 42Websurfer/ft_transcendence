from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AbstractUser

User = get_user_model()


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    is_third_party_user = models.BooleanField(default=False)  # Feld hinzufügen

    def __str__(self):
        return self.user.username

class Friendship(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]

    user = models.ForeignKey(User, related_name='sent_requests', on_delete=models.CASCADE)
    friend = models.ForeignKey(User, related_name='received_requests', on_delete=models.CASCADE)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together=('user', 'friend')

    def __str__(self):
        return f"{self.user.username} -> {self.friend.username} ({self.status})"
