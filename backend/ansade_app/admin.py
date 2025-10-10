from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _

from .models import Categorie, Theme, Tableau, Donnees, User,LigneIndicateur

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Categorie

@admin.register(User)
class CustomUserAdmin(BaseUserAdmin):
    model = User
    list_display = ('email', 'is_chef', 'categorie', 'is_staff')
    list_filter = ('is_chef', 'is_staff', 'is_superuser')
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Permissions', {'fields': ('is_chef', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Catégorie', {'fields': ('categorie',)}),
        ('Dates importantes', {'fields': ('last_login',)}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'is_chef', 'is_staff', 'is_superuser', 'categorie'),
        }),
    )
    search_fields = ('email',)
    ordering = ('email',)


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
    list_display = ('id', 'nom_feuille', 'titre', 'theme','etiquette_ligne')
    search_fields = ('titre',)
    list_filter = ('theme',)

@admin.register(Donnees)
class DonneesAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'get_ligne_label',
        'colonne',
        'unite',
        'source',
        'valeur',
        'categorie',
        'tableau',
        'get_code',
        'get_parent_code',
        'get_ordre',
    )
    search_fields = ('ligne__label', 'colonne', 'source', 'ligne__code', 'ligne__parent_code', 'ligne__ordre')
    list_filter = ('categorie', 'tableau')

    @admin.display(description="LIGNE")
    def get_ligne_label(self, obj):
        return obj.ligne.label if obj.ligne else ""

    @admin.display(description="CODE")
    def get_code(self, obj):
        return obj.ligne.code if obj.ligne else ""

    @admin.display(description="PARENT CODE")
    def get_parent_code(self, obj):
        return obj.ligne.parent_code if obj.ligne else ""

    @admin.display(description="ORDRE")
    def get_ordre(self, obj):
        return obj.ligne.ordre if obj.ligne else ""


@admin.register(LigneIndicateur)
class LigneIndicateurAdmin(admin.ModelAdmin):
    list_display = ('id', 'label', 'code', 'parent_code', 'ordre', 'tableau')
    search_fields = ('label', 'code', 'parent_code')
    list_filter = ('tableau',)