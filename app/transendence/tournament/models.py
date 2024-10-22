from django.db import models
from django.contrib.auth import get_user_model

# Create your models here.
User = get_user_model()

class GameStatsUser(models.Model):
    user = models.OneToOneField(User, null=True, blank=True, on_delete=models.SET_NULL)
    username = models.CharField(max_length=16, null=True, blank=True)
    wins = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)
    tournament_wins = models.IntegerField(default=0)
    goals_against = models.IntegerField(default=0)
    goals_for = models.IntegerField(default = 0)

    def save(self, *args, **kwargs):
        if self.user:
            self.username = self.user.username
        super().save(*args, **kwargs)

    def __str__(self):
        return (f"Game statistic from {self.username}")

class OnlineMatch(models.Model):
    home = models.ForeignKey(GameStatsUser, related_name='home_matches', null=True, blank=True, on_delete=models.SET_NULL)
    away = models.ForeignKey(GameStatsUser, related_name='away_matches', null=True, blank=True, on_delete=models.SET_NULL)
    home_score = models.IntegerField(default=0)
    away_score = models.IntegerField(default=0)
    winner = models.ForeignKey(GameStatsUser, null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)
    modus = models.CharField(max_length=50, default='DEFAULT')
    home_username = models.CharField(max_length=150, blank=True, null=True)
    away_username = models.CharField(max_length=150, blank=True, null=True)
    #tournament = models.ForeignKey(TournamentModel, related_name='tournament_matches') for calling all matches from the tournament.object
    def save(self, *args, **kwargs):
        if self.home:
            self.home_username = self.home.username
        if self.away:
            self.away_username = self.away.username
        super().save(*args, **kwargs)
        if self.home and self.away:
            self.home.goals_for += self.home_score
            self.home.goals_against += self.away_score
            self.away.goals_for += self.away_score
            self.away.goals_against += self.home_score

            if self.winner:
                if self.winner == self.home:
                    self.home.wins += 1
                    self.away.losses += 1
                elif self.winner == self.away:
                    self.away.wins += 1
                    self.home.losses += 1

            self.home.save()
            self.away.save()

    def __str__(self):
        return f"{self.home.username} vs {self.away.username}"
