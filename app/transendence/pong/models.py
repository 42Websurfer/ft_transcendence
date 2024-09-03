from django.db import models

class User(models.Model):
    firstname = models.CharField(max_length=255)
    lastname = models.CharField(max_length=255)
    username = models.CharField(max_length=255, default="DEFAULT")
    email = models.EmailField(default="default@email.com")
    password = models.CharField(max_length=100, default="DEFAULT")

    def __str__(self):  #describes the user instance if for example show all objects,
        return f"{self.firstname} {self.lastname}"
