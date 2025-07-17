from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager

class Categorie(models.Model):
    nom_cat = models.CharField(max_length=255)

    def __str__(self):
        return self.nom_cat


class Theme(models.Model):
    nom_theme = models.CharField(max_length=255)
    categorie = models.ForeignKey(Categorie, on_delete=models.CASCADE)

    def __str__(self):
        return self.nom_theme


class Tableau(models.Model):
    nom_feuille = models.CharField(max_length=255)
    titre = models.CharField(max_length=255)
    etiquette_ligne = models.CharField(max_length=255, blank=True, null=True)
    theme = models.ForeignKey(Theme, on_delete=models.CASCADE)
    source = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.titre


class Donnees(models.Model):
    ligne = models.CharField(max_length=255)
    colonne = models.CharField(max_length=255)
    unite = models.CharField(max_length=100)
    source = models.CharField(max_length=255)
    valeur = models.FloatField()
    categorie = models.ForeignKey(Categorie, on_delete=models.CASCADE)
    tableau = models.ForeignKey(Tableau, on_delete=models.CASCADE)


# class UserManager(BaseUserManager):
#     def create_user(self, email, nom_prenom, password=None):
#         user = self.model(email=email, nom_prenom=nom_prenom)
#         user.set_password(password)
#         user.save()
#         return user

#     def create_superuser(self, email, nom_prenom, password=None):
#         user = self.create_user(email=email, nom_prenom=nom_prenom, password=password)
#         user.is_admin = True
#         user.active = True
#         user.save()
#         return user


# class User(AbstractBaseUser):
#     nom_prenom = models.CharField(max_length=100)
#     email = models.EmailField(unique=True)
#     mot_de_passe = models.CharField(max_length=255)
#     role = models.CharField(max_length=255)
#     active = models.BooleanField(default=False)
#     is_admin = models.BooleanField(default=False)
#     date_creation = models.DateTimeField(auto_now_add=True)
#     categorie = models.ForeignKey(Categorie, on_delete=models.SET_NULL, null=True)

#     USERNAME_FIELD = 'email'
#     REQUIRED_FIELDS = ['nom_prenom']

#     objects = UserManager()

#     def __str__(self):
#         return self.nom_prenom

#     def has_perm(self, perm, obj=None):
#         return self.is_admin

#     def has_module_perms(self, app_label):
#         return self.is_admin
