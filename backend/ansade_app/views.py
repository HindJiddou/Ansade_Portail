from rest_framework import viewsets
from .models import Categorie, Theme, Tableau, Donnees
from .serializers import CategorieSerializer, ThemeSerializer, TableauSerializer, DonneesSerializer
import openpyxl
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser
from rest_framework import status, generics
import re
from collections import defaultdict
from django.shortcuts import get_object_or_404
import pandas as pd
import math
import openpyxl
from django.db.models import Q
from django.db.models import F


class CategorieViewSet(viewsets.ModelViewSet):
    queryset = Categorie.objects.all()
    serializer_class = CategorieSerializer

class ThemeViewSet(viewsets.ModelViewSet):
    queryset = Theme.objects.all()
    serializer_class = ThemeSerializer

class TableauViewSet(viewsets.ModelViewSet):
    queryset = Tableau.objects.all()
    serializer_class = TableauSerializer

class DonneesViewSet(viewsets.ModelViewSet):
    queryset = Donnees.objects.all()
    serializer_class = DonneesSerializer


class ListeSourcesAPIView(APIView):
    def get(self, request):
        sources = Tableau.objects.exclude(source="").values_list('source', flat=True).distinct()
        return Response(sorted(sources))

from urllib.parse import unquote

class TableauxParSourceAPIView(APIView):
    def get(self, request, source):
        decoded_source = unquote(source)
        tableaux = Tableau.objects.filter(source=decoded_source).values('id', 'titre')
        return Response(list(tableaux))

 
class RechercheGlobaleAPIView(APIView):
    def get(self, request):
        query = request.GET.get('q', '').strip()
        if not query:
            return Response([])

        results = []

        # Recherche dans Categorie
        for c in Categorie.objects.filter(nom_cat__icontains=query):
            results.append({
                'type': 'Categorie',
                'id': c.id,
                'nom': c.nom_cat,
            })

        # Recherche dans Theme
        for t in Theme.objects.filter(nom_theme__icontains=query):
            results.append({
                'type': 'Theme',
                'id': t.id,
                'nom': t.nom_theme,
            })

        # Recherche dans Tableau
        for tb in Tableau.objects.filter(Q(titre__icontains=query) | Q(source__icontains=query)):
            results.append({
                'type': 'Tableau',
                'id': tb.id,
                'nom': tb.titre,
                'source': tb.source
            })

        return Response(results)


class ImportExcelView(APIView):
    parser_classes = [MultiPartParser]

    def post(self, request):
        fichier_excel = request.FILES.get('file')
        id_theme = request.data.get('theme_id')
        id_cat = request.data.get('cat_id')

        if not all([fichier_excel, id_theme, id_cat]):
            return Response({'error': 'Veuillez fournir le fichier, theme_id et cat_id'}, status=400)

        try:
            wb = openpyxl.load_workbook(fichier_excel, data_only=True)
        except Exception as e:
            return Response({'error': f'Erreur de lecture du fichier : {str(e)}'}, status=400)

        for feuille in wb.sheetnames:
            ws = wb[feuille]

            titre = ''
            source = ''
            headers = []
            lignes = []
            started = False
            etiquette_ligne_detectee = "Indicateur"

            for row in ws.iter_rows(values_only=True):
                row_str = [str(cell).strip() if cell is not None else '' for cell in row]

                if not started and any("Tableau" in cell for cell in row_str):
                    titre = ' '.join(row_str).strip()
                    started = True
                    continue

                if started and any(cell.lower().startswith("source") for cell in row_str if cell):
                    source = ' '.join(row_str).replace("Source :", "").strip()
                    break

                if started:
                    if not headers and any(cell != '' for cell in row_str):
                        headers = row_str
                        if headers[0] == '':
                            headers[0] = ''
                        etiquette_ligne_detectee = headers[0]
                    elif any(cell != '' for cell in row_str):
                        lignes.append(row_str)

            if not titre:
                titre = f"Titre non trouvé ({feuille})"

            tableau = Tableau.objects.create(
                nom_feuille=feuille,
                titre=titre,
                theme_id=id_theme,
                source=source,
                etiquette_ligne=etiquette_ligne_detectee
            )

            for row in lignes:
                ligne_label = row[0] if row[0] else ""
                for i, cell in enumerate(row[1:], start=1):
                    cell_str = str(cell).strip()

                    if "%" in cell_str:
                        unite = "%"
                        cell_str = cell_str.replace("%", "")
                    else:
                        unite = ""

                    cell_str = cell_str.replace('\u202f', '').replace(' ', '').replace(',', '.')
                    try:
                        val = float(cell_str)
                    except:
                        continue

                    Donnees.objects.create(
                        ligne=ligne_label,
                        colonne=headers[i] if i < len(headers) else f'Col{i}',
                        unite=unite,
                        source=source,
                        valeur=val,
                        categorie_id=id_cat,
                        tableau=tableau
                    )

        return Response({'message': 'Importation réussie'}, status=status.HTTP_201_CREATED)

class TableauDetailStructureView(APIView):
    def get(self, request, tableau_id):
        donnees = Donnees.objects.filter(tableau_id=tableau_id).order_by('id')

        if not donnees.exists():
            return Response({
                "colonnes_groupées": {},
                "data": [],
                "has_sous_indicateurs": False
            })

        colonnes_principales = defaultdict(set)
        structure = defaultdict(lambda: {
            "sous_indicateurs": [],
            "valeurs": defaultdict(dict)
        })

        for d in donnees:
            ligne = d.ligne.strip() if d.ligne else ""
            colonne = d.colonne.strip() if d.colonne else ""
            valeur_formatee = f"{d.valeur:.2f}".rstrip('0').rstrip('.') if d.valeur is not None else ""
            valeur_finale = f"{valeur_formatee}{d.unite}" if d.unite else valeur_formatee

            if "~" in colonne:
                col_principal, col_sous = map(str.strip, colonne.split("~", 1))
            else:
                col_principal, col_sous = colonne, ""

            colonnes_principales[col_principal].add(col_sous)

            if "~" in ligne:
                principal, sous = map(str.strip, ligne.split("~", 1))
                structure[principal]["sous_indicateurs"].append({
                    "nom": sous,
                    "valeurs": {col_principal: {col_sous: valeur_finale}}
                })
            else:
                structure[ligne]["valeurs"][col_principal][col_sous] = valeur_finale

        colonnes_groupées = {
            col: list(sous) if any(sous) else [""]
            for col, sous in colonnes_principales.items()
        }


        data = []
        for indicateur, contenu in structure.items():
            if contenu["sous_indicateurs"]:
                regroupé = defaultdict(lambda: defaultdict(dict))
                for sous in contenu["sous_indicateurs"]:
                    nom = sous["nom"]
                    for c, sous_vals in sous["valeurs"].items():
                        for sc, val in sous_vals.items():
                            regroupé[nom][c][sc] = val
                data.append({
                    "indicateur": indicateur,
                    "sous_indicateurs": [
                        {"nom": nom, "valeurs": regroupé[nom]}
                        for nom in regroupé
                    ]
                })
            else:
                data.append({
                    "indicateur": indicateur,
                    "valeurs": dict(contenu["valeurs"])
                })

        # Ajout ici : présence réelle de sous-indicateurs
        has_sous_indicateurs = any(
            row.get("sous_indicateurs") for row in structure.values()
        )

        return Response({
            "colonnes_groupées": colonnes_groupées,
            "data": data,
            "has_sous_indicateurs": has_sous_indicateurs
        })



class TableauFiltresOptionsView(APIView):
    def get(self, request, tableau_id):
        try:
            tableau = Tableau.objects.get(id=tableau_id)
        except Tableau.DoesNotExist:
            return Response({"error": "Tableau non trouvé"}, status=status.HTTP_404_NOT_FOUND)

        donnees = Donnees.objects.filter(tableau=tableau)

        lignes_set = set()
        colonnes_set = set()

        for d in donnees:
            ligne = d.ligne.strip()
            colonne = d.colonne.strip()

            lignes_set.add(ligne)
            colonnes_set.add(colonne)

        # Traitement des lignes
        lignes_groupées = defaultdict(list)  # {Indicateur: [Sous1, Sous2]}
        for ligne in lignes_set:
            if "~" in ligne:
                indicateur, sous = map(str.strip, ligne.split("~", 1))
                lignes_groupées[indicateur].append(sous)
            else:
                lignes_groupées[ligne]  # indicateur principal seul

        lignes_finales = []
        for indicateur, sous_liste in lignes_groupées.items():
            if sous_liste:
                for sous in sous_liste:
                    lignes_finales.append(f"{indicateur} ~ {sous}")
            else:
                lignes_finales.append(indicateur)

        # Colonnes (similaire à lignes)
        colonnes_groupées = defaultdict(list)
        for col in colonnes_set:
            if "~" in col:
                principal, sous = map(str.strip, col.split("~", 1))
                colonnes_groupées[principal].append(sous)
            else:
                colonnes_groupées[col]

        colonnes_finales = []
        for principal, sous_liste in colonnes_groupées.items():
            if sous_liste:
                for sous in sous_liste:
                    colonnes_finales.append(f"{principal} ~ {sous}")
            else:
                colonnes_finales.append(principal)

        return Response({
            "lignes": sorted(lignes_finales),
            "colonnes": sorted(colonnes_finales)
        })

class TableauFiltreView(APIView):
    def post(self, request, tableau_id):
        lignes = request.data.get("lignes", [])  # Ex: ["Population urbaine ~ Masculine"]
        colonnes = request.data.get("colonnes", [])  # Ex: ["1977", "2023"]

        try:
            tableau = Tableau.objects.get(id=tableau_id)
        except Tableau.DoesNotExist:
            return Response({"error": "Tableau non trouvé"}, status=status.HTTP_404_NOT_FOUND)
        filtres = Q(tableau=tableau)

        if lignes:
            conditions = Q()
            for ligne in lignes:
                parts = ligne.split("~")
                indicateur = parts[0].strip()
                sous = parts[1].strip() if len(parts) > 1 else None

                if sous and sous.lower() != "ensemble":
                    conditions |= Q(ligne=f"{indicateur}~{sous}")
                else:
                    conditions |= Q(ligne=indicateur)

            filtres &= conditions

        if colonnes:
            filtres &= Q(colonne__in=colonnes)

        donnees = Donnees.objects.filter(filtres)
        serializer = DonneesSerializer(donnees, many=True)
        return Response(serializer.data)


class TableauFiltreStructureView(APIView):
    def post(self, request, tableau_id):
        lignes = request.data.get("lignes", [])
        colonnes = request.data.get("colonnes", [])

        try:
            tableau = Tableau.objects.get(id=tableau_id)
        except Tableau.DoesNotExist:
            return Response({"error": "Tableau non trouvé"}, status=status.HTTP_404_NOT_FOUND)

        filtres = Q(tableau=tableau)

        # Filtrage des lignes
        if lignes:
            conditions = Q()
            for ligne in lignes:
                parts = ligne.split("~")
                indicateur = parts[0].strip()
                sous = parts[1].strip() if len(parts) > 1 else None
                if sous and sous.lower() != "ensemble":
                    conditions |= Q(ligne=f"{indicateur}~{sous}")
                else:
                    conditions |= Q(ligne=indicateur)
            filtres &= conditions

        # Filtrage des colonnes
        if colonnes:
            filtres &= Q(colonne__in=colonnes)

        donnees = Donnees.objects.filter(filtres).order_by('ligne')

        if not donnees.exists():
            return Response({
                "colonnes_groupées": {},
                "data": [],
                "has_sous_indicateurs": False
            })

        # Même traitement que TableauDetailStructureView
        colonnes_principales = defaultdict(set)
        structure = defaultdict(lambda: {
            "sous_indicateurs": [],
            "valeurs": defaultdict(dict)
        })

        for d in donnees:
            ligne = d.ligne.strip() if d.ligne else ""
            colonne = d.colonne.strip() if d.colonne else ""
            valeur_formatee = f"{d.valeur:.2f}".rstrip('0').rstrip('.') if d.valeur is not None else ""
            valeur_finale = f"{valeur_formatee}{d.unite}" if d.unite else valeur_formatee

            if "~" in colonne:
                col_principal, col_sous = map(str.strip, colonne.split("~", 1))
            else:
                col_principal, col_sous = colonne, ""

            colonnes_principales[col_principal].add(col_sous)

            if "~" in ligne:
                principal, sous = map(str.strip, ligne.split("~", 1))
                structure[principal]["sous_indicateurs"].append({
                    "nom": sous,
                    "valeurs": {col_principal: {col_sous: valeur_finale}}
                })
            else:
                structure[ligne]["valeurs"][col_principal][col_sous] = valeur_finale

        colonnes_groupées = {
            col: sorted(list(sous)) if any(sous) else [""]
            for col, sous in colonnes_principales.items()
        }

        data = []
        for indicateur, contenu in structure.items():
            if contenu["sous_indicateurs"]:
                regroupé = defaultdict(lambda: defaultdict(dict))
                for sous in contenu["sous_indicateurs"]:
                    nom = sous["nom"]
                    for c, sous_vals in sous["valeurs"].items():
                        for sc, val in sous_vals.items():
                            regroupé[nom][c][sc] = val
                data.append({
                    "indicateur": indicateur,
                    "sous_indicateurs": [
                        {"nom": nom, "valeurs": regroupé[nom]}
                        for nom in regroupé
                    ]
                })
            else:
                data.append({
                    "indicateur": indicateur,
                    "valeurs": dict(contenu["valeurs"])
                })

        has_sous_indicateurs = any(
            row.get("sous_indicateurs") for row in structure.values()
        )

        return Response({
            "colonnes_groupées": colonnes_groupées,
            "data": data,
            "has_sous_indicateurs": has_sous_indicateurs
        })

class TableauAnalyseAPIView(APIView):
    def get(self, request, pk):
        try:
            tableau = Tableau.objects.get(id=pk)
        except Tableau.DoesNotExist:
            return Response({"detail": "Tableau non trouvé"}, status=404)

        donnees = Donnees.objects.filter(tableau=tableau)

        lignes = [d.ligne for d in donnees if d.ligne]
        colonnes = [d.colonne for d in donnees if d.colonne]

        # Détection du type de tableau
        a_wilayas = any("wilaya" in l.lower() for l in lignes)
        if all(c.isdigit() or c.startswith("20") or c.startswith("19") for c in colonnes):
            tableau_type = "annees"
        elif any(c in colonnes for c in ["Féminin", "Masculin", "Total"]):
            tableau_type = "groupes"
        elif a_wilayas:
            tableau_type = "carte"
        else:
            tableau_type = "generique"

        # Format des données
        results = []
        for d in donnees:
            try:
                valeur = float(d.valeur) if isinstance(d.valeur, str) else d.valeur
            except:
                valeur = 0
            results.append({
                "categorie_ligne": d.ligne or "",
                "categorie_colonne": d.colonne or "",
                "valeur": valeur
            })

        return Response({
            "titre": tableau.titre,
            "donnees": results,
            "type": tableau_type
        })
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Donnees, Tableau

class CarteParTableauAPIView(APIView):
    def get(self, request, tableau_id):
        try:
            tableau = Tableau.objects.get(id=tableau_id)
        except Tableau.DoesNotExist:
            return Response({'error': 'Tableau non trouvé'}, status=status.HTTP_404_NOT_FOUND)

        if tableau.etiquette_ligne.lower() != 'wilaya':
            return Response({'error': 'Ce tableau ne contient pas des données par Wilaya'}, status=status.HTTP_400_BAD_REQUEST)

        donnees = Donnees.objects.filter(tableau_id=tableau_id)

        tableau_donnees = {}

        for donnee in donnees:
            annee = donnee.colonne
            wilaya = donnee.ligne
            valeur = donnee.valeur

            if not annee or not wilaya:
                continue

            if annee not in tableau_donnees:
                tableau_donnees[annee] = {}

            if wilaya not in tableau_donnees[annee]:
                tableau_donnees[annee][wilaya] = []

            tableau_donnees[annee][wilaya].append(valeur)

        # Trie des années
        annees_triees = sorted(tableau_donnees.keys(), key=lambda x: int(x) if x.isdigit() else x)

        # Moyenne pour chaque wilaya pour la première année (la plus ancienne)
        valeurs_par_defaut = {}
        if annees_triees:
            premiere_annee = annees_triees[0]
            for wilaya, valeurs in tableau_donnees[premiere_annee].items():
                moyenne = sum(valeurs) / len(valeurs) if valeurs else 0
                valeurs_par_defaut[wilaya] = round(moyenne, 2)

        return Response({
            'titre': tableau.titre,
            'annees': annees_triees,
            'valeurs': valeurs_par_defaut
        })
