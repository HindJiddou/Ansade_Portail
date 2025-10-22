# models.py

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone

class Categorie(models.Model):
    nom_cat = models.CharField(max_length=255)

    def __str__(self):
        return self.nom_cat

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("L'adresse email est obligatoire")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Le superutilisateur doit avoir is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Le superutilisateur doit avoir is_superuser=True.')

        return self.create_user(email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    is_chef = models.BooleanField(default=False)
    categorie = models.ForeignKey(Categorie, on_delete=models.SET_NULL, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self):
        return self.email


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

class LigneIndicateur(models.Model):
    tableau = models.ForeignKey(Tableau, on_delete=models.CASCADE)
    label = models.TextField()
    code = models.CharField(max_length=100, blank=True, null=True)
    parent_code = models.CharField(max_length=100, blank=True, null=True)
    ordre = models.IntegerField(blank=True, null=True)

    class Meta:
        ordering = ['ordre']

    def __str__(self):
        return self.label


# models.py

class Donnees(models.Model):
    ligne = models.ForeignKey("LigneIndicateur", on_delete=models.SET_NULL, null=True, blank=True)  # ✅ null autorisé
    colonne = models.CharField(max_length=255)
    unite = models.CharField(max_length=50, blank=True)
    source = models.TextField(blank=True)
    valeur = models.FloatField(null=True, blank=True)
    statut = models.CharField(max_length=50, blank=True, null=True)
    note_colonne = models.CharField(max_length=255, blank=True, null=True)  
    categorie = models.ForeignKey(Categorie, on_delete=models.CASCADE)
    tableau = models.ForeignKey(Tableau, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.ligne} - {self.colonne}: {self.valeur}"
