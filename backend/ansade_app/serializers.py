from rest_framework import serializers
from .models import Categorie, Theme, Tableau, Donnees

class CategorieSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categorie
        fields = '__all__'

class ThemeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Theme
        fields = '__all__'

class TableauSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tableau
        fields = '__all__'

class DonneesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Donnees
        fields = '__all__'
