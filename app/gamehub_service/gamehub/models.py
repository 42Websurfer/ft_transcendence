from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class GameStatsUser(models.Model):
    user_id = models.IntegerField(default=0)
    username = models.CharField(max_length=16, null=True, blank=True)
    avatar = models.ImageField(upload_to='avatar/', default="defaults/default_avatar.png")
    wins = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)
    tournament_wins = models.IntegerField(default=0)
    goals_against = models.IntegerField(default=0)
    goals_for = models.IntegerField(default = 0)
    created_at = models.DateTimeField(auto_now_add=True)


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
    def save(self, *args, **kwargs):
        if self.home:
            self.home_username = self.home.username
        if self.away:
            self.away_username = self.away.username
        if self.home and self.away:
            if self.home_score > self.away_score:
                self.winner = self.home
            else:
                self.winner = self.away
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


class Tournament(models.Model):
    tournament_id = models.CharField(max_length=50, unique=True)
    date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Tournament: {self.tournament_id}."

class TournamentResults(models.Model):
    tournament_id = models.ForeignKey(Tournament, related_name="all_results", on_delete=models.CASCADE)
    rank = models.IntegerField(default=1)
    games = models.IntegerField(default=0)
    won = models.IntegerField(default=0)
    lost = models.IntegerField(default=0)
    goals_for = models.IntegerField(default=0)
    goals_against = models.IntegerField(default=0)
    diff = models.IntegerField(default=0)
    points = models.IntegerField(default=0)
    user = models.ForeignKey(GameStatsUser, related_name="all_tournament_results", on_delete=models.CASCADE)

    def __str__(self):
        return f"Tournament result ({self.tournament_id.tournament_id}) from {self.user.username}"
