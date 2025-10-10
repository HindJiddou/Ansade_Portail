from rest_framework import serializers
from .models import Categorie, Theme, Tableau, Donnees,User,LigneIndicateur
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth import authenticate
from django.utils.translation import gettext_lazy as _

class CategorieSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categorie
        fields = '__all__'

class LigneIndicateurSerializer(serializers.ModelSerializer):
    class Meta:
        model = LigneIndicateur
        fields = ['id', 'label', 'ordre', 'code', 'parent_code', 'niveau']

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'email'

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")

        user = authenticate(request=self.context.get("request"), email=email, password=password)

        if not user:
            raise AuthenticationFailed(_('Email ou mot de passe incorrect'))

        data = super().validate(attrs)
        data['user'] = {
        'id': user.id,
        'email': user.email,
        'is_chef': user.is_chef,
        'is_superuser': user.is_superuser,
        'is_staff': user.is_staff,
        'categorie': CategorieSerializer(user.categorie).data if user.categorie else None
    }

        return data




class UserSerializer(serializers.ModelSerializer):
    categorie = CategorieSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'is_chef', 'is_superuser', 'is_staff', 'categorie']

        
class ThemeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Theme
        fields = '__all__'

class TableauSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tableau
        fields = '__all__'

from .models import Donnees

class DonneesSerializer(serializers.ModelSerializer):
    ligne = LigneIndicateurSerializer()

    class Meta:
        model = Donnees
        fields = ['id', 'valeur', 'colonne', 'unite', 'source', 'ligne']
