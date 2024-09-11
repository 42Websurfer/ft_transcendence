from django.db import models

class User(models.Model):
    email = models.EmailField(default="default@email.com")
    password = models.CharField(max_length=255, default="DEFAULT")
    firstname = models.CharField(max_length=100, default="DEFAULT")
    lastname = models.CharField(max_length=100, default = "DEFAULT")
    username = models.CharField(max_length=100, default = "DEFAULT")
    
