from django.contrib import admin
from .models import Categorie, Theme, Tableau, Donnees

@admin.register(Categorie)
class CategorieAdmin(admin.ModelAdmin):
    list_display = ('id', 'nom_cat')
    search_fields = ('nom_cat',)

@admin.register(Theme)
class ThemeAdmin(admin.ModelAdmin):
    list_display = ('id', 'nom_theme', 'categorie')
    search_fields = ('nom_theme',)
    list_filter = ('categorie',)

@admin.register(Tableau)
class TableauAdmin(admin.ModelAdmin):
    list_display = ('id', 'nom_feuille', 'titre', 'theme')
    search_fields = ('titre',)
    list_filter = ('theme',)

@admin.register(Donnees)
class DonneesAdmin(admin.ModelAdmin):
    list_display = ('id', 'ligne', 'colonne', 'unite', 'source', 'valeur', 'categorie', 'tableau')
    search_fields = ('ligne', 'colonne', 'source')
    list_filter = ('categorie', 'tableau')
