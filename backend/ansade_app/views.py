from rest_framework import viewsets
from .models import Categorie, Theme, Tableau, Donnees,LigneIndicateur
from .serializers import CategorieSerializer, ThemeSerializer, TableauSerializer, DonneesSerializer,LigneIndicateurSerializer
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
from rest_framework.permissions import IsAuthenticated,IsAdminUser,AllowAny
from .permissions import IsChef
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from .serializers import UserSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate


class CustomLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")

        user = authenticate(request, email=email, password=password)
        if user is None:
            return Response({"error": "Email ou mot de passe incorrect"}, status=401)

        refresh = RefreshToken.for_user(user)
        user_data = UserSerializer(user).data

        return Response({
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": user_data
        })


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

# views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

class UserInfoAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "id": user.id,
            "email": user.email,
            "is_superuser": user.is_superuser,
            "is_chef": user.is_chef,
        })



class CategorieViewSet(viewsets.ModelViewSet):
    queryset = Categorie.objects.all()
    serializer_class = CategorieSerializer
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return []

class ThemeViewSet(viewsets.ModelViewSet):
    queryset = Theme.objects.all()
    serializer_class = ThemeSerializer
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return []

class TableauViewSet(viewsets.ModelViewSet):
    queryset = Tableau.objects.all()
    serializer_class = TableauSerializer
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsChef()]
        return []

class DonneesViewSet(viewsets.ModelViewSet):
    queryset = Donnees.objects.all()
    serializer_class = DonneesSerializer
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsChef()]
        return []


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
    permission_classes = [IsChef]

    def post(self, request):
        # Sécurité: un chef ne peut importer que dans sa catégorie
        if request.user.is_chef and not request.user.is_superuser:
            if int(request.data.get('cat_id')) != request.user.categorie_id:
                return Response({'error': 'Vous ne pouvez importer que dans votre propre catégorie'}, status=403)

        fichier_excel = request.FILES.get('file')
        id_theme = request.data.get('theme_id')
        id_cat = request.data.get('cat_id')

        if not all([fichier_excel, id_theme, id_cat]):
            return Response({'error': 'Veuillez fournir le fichier, theme_id et cat_id'}, status=400)

        try:
            wb = openpyxl.load_workbook(fichier_excel, data_only=True)
        except Exception as e:
            return Response({'error': f'Erreur de lecture du fichier : {str(e)}'}, status=400)

        # --------- helpers ---------
        def parse_numeric(cell):
            """Retourne (valeur_float_ou_None, had_percent_sign: bool)"""
            if isinstance(cell, str):
                had_pct = '%' in cell
                txt = (cell.replace('%', '')
                           .replace('\u202f', '')
                           .replace(' ', '')
                           .replace(',', '.')).strip()
                if txt == '':
                    return None, had_pct
                try:
                    return float(txt), had_pct
                except ValueError:
                    return None, had_pct
            elif isinstance(cell, (int, float)):
                return float(cell), False
            return None, False

        for feuille in wb.sheetnames:
            ws = wb[feuille]

            lignes = []
            first_non_empty_row = None  # garde la 1ère ligne non vide pour tester le "nouveau format"

            for row in ws.iter_rows(values_only=True):
                row_str = [str(cell).strip() if cell is not None else '' for cell in row]
                if all(cell == '' for cell in row_str):
                    continue
                if first_non_empty_row is None:
                    first_non_empty_row = row_str
                lignes.append(row_str)

            if not lignes:
                continue

            # ===== Test "nouveau format" sur la 1ère ligne non vide
            normalized_first_row = [h.lower() for h in (first_non_empty_row or [])]
            is_new_format = all(col in normalized_first_row
                                for col in ["titre_fr", "source_fr", "ordre", "code", "parent", "des_fr"])

            # ==============================
            # NOUVEAU FORMAT (structuré)
            # ==============================
            if is_new_format:
                try:
                    titre_fr_idx = normalized_first_row.index('titre_fr')
                    source_fr_idx = normalized_first_row.index('source_fr')
                    ordre_idx    = normalized_first_row.index('ordre')
                    code_idx     = normalized_first_row.index('code')
                    parent_idx   = normalized_first_row.index('parent')
                    des_fr_idx   = normalized_first_row.index('des_fr')
                except ValueError as e:
                    return Response({'error': f"Colonnes manquantes : {str(e)}"}, status=400)

                # Colonnes années = tout ce qui vient après des_fr
                annee_indexes = [i for i in range(des_fr_idx + 1, len(first_non_empty_row))]

                if len(lignes) < 2:
                    continue  # pas de données

                titre = lignes[1][titre_fr_idx]
                source = lignes[1][source_fr_idx]
                is_pourcentage = "%" in titre

                tableau = Tableau.objects.create(
                    nom_feuille=feuille,
                    titre=titre,
                    theme_id=id_theme,
                    source=source,
                    etiquette_ligne="Indicateur"
                )

                # Itérer sur les lignes de données (sauter l'entête)
                for row in lignes[1:]:
                    label = str(row[des_fr_idx]).strip() if len(row) > des_fr_idx else ''
                    if not label:
                        continue

                    code = str(row[code_idx]).strip() if len(row) > code_idx and row[code_idx] else ''
                    parent_code = str(row[parent_idx]).strip() if len(row) > parent_idx and row[parent_idx] else ''

                    ordre = None
                    if len(row) > ordre_idx and row[ordre_idx] != '':
                        try:
                            ordre = int(float(str(row[ordre_idx]).replace(',', '.')))
                        except Exception:
                            ordre = None

                    ligne_obj = LigneIndicateur.objects.create(
                        tableau=tableau,
                        label=label,
                        code=code,
                        parent_code=parent_code,
                        ordre=ordre
                    )

                    for idx in annee_indexes:
                        if idx >= len(row):
                            continue
                        annee = first_non_empty_row[idx]
                        if not annee:
                            continue

                        raw_val, had_percent = parse_numeric(row[idx])
                        if raw_val is None:
                            continue

                        unite = ""
                        val = raw_val
                        if is_pourcentage or had_percent:
                            unite = "%"
                            if abs(val) > 1.5:
                                val = val / 100.0
                            val = round(val, 6)

                        Donnees.objects.create(
                            ligne=ligne_obj,
                            colonne=str(annee),
                            unite=unite,
                            source=source,
                            valeur=val,
                            categorie_id=id_cat,
                            tableau=tableau
                        )

                continue  # feuille traitée (nouveau format)

            # ==============================
            # ANCIEN FORMAT (titre "TABLEAU")
            # ==============================
            titre = ""
            source = ""
            data_start = None  # index de la ligne d'entête (juste après le titre)

            def is_non_empty(row):
                return any((str(c or "").strip() for c in row))

            def first_non_empty_after(rows, i):
                for j in range(i + 1, len(rows)):
                    if is_non_empty(rows[j]):
                        return j
                return None

            for idx, row in enumerate(lignes):
                joined = " ".join([str(c) for c in row if c]).strip()
                up = joined.upper()

                # détection stricte du titre
                if re.search(r'\bTABLEAU\b', up) or re.match(r'^\s*TAB(?:LEAU)?\s*[\.:]?\s*\d+', up):
                    titre = joined
                    data_start = first_non_empty_after(lignes, idx)
                    continue

                # source
                if re.search(r'\bSOURCE\b', up):
                    src_text = re.sub(r'(?i)^source\s*:?', '', joined).strip()
                    if src_text:
                        source = src_text

            if not titre or data_start is None or data_start >= len(lignes):
                continue  # rien à importer sur cette feuille

            # Entête (années)
            headers_old = lignes[data_start] if lignes[data_start] else []
            etiquette_value = str(headers_old[0]).strip() if headers_old else ""

            tableau = Tableau.objects.create(
                nom_feuille=feuille,
                titre=titre,                 # ex. "Tableau TS3 : ..."
                theme_id=id_theme,
                source=source,
                etiquette_ligne=etiquette_value
            )

            # Lignes de données
            data_rows = lignes[data_start + 1:]
            is_pourcentage = "%" in titre

            for row in data_rows:
                if not row or len(row) < 2:
                    continue

                indicateur_brut = (row[0] or "").strip()
                if not indicateur_brut:
                    continue

                ligne_obj = LigneIndicateur.objects.create(
                    tableau=tableau,
                    label=indicateur_brut,
                    code='',
                    parent_code='',
                    ordre=None
                )

                # Valeurs par colonnes (à partir de 1)
                for cidx in range(1, len(headers_old)):
                    if cidx >= len(row):
                        continue
                    annee = headers_old[cidx]
                    if not annee:
                        continue

                    raw_val, had_percent = parse_numeric(row[cidx])
                    if raw_val is None:
                        continue

                    unite = ""
                    val = raw_val
                    if is_pourcentage or had_percent:
                        unite = "%"
                        if abs(val) > 1.5:
                            val = val / 100.0
                        val = round(val, 6)

                    Donnees.objects.create(
                        ligne=ligne_obj,
                        colonne=str(annee),
                        unite=unite,
                        source=source,
                        valeur=val,
                        categorie_id=id_cat,
                        tableau=tableau
                    )

        return Response({'message': 'Importation réussie'}, status=201)

from collections import OrderedDict, defaultdict
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Donnees

class TableauDetailStructureView(APIView):
    def get(self, request, tableau_id):
        donnees = (
            Donnees.objects
            .filter(tableau_id=tableau_id)
            .select_related("ligne", "tableau")
            .order_by("id")
        )

        if not donnees.exists():
            return Response({
                "colonnes_groupées": {},
                "colonnes_order": [],
                "data": [],
                "has_sous_indicateurs": False,
                "meta": {"titre": "", "source": "", "etiquette_ligne": ""},
                "format": None
            })

        tableau = donnees.first().tableau

        def format_value(unite, valeur):
            if valeur is None:
                return ""
            if unite == "%":
                # Stocké en fraction (0..1.5) -> *100, sinon déjà pourcentage (ex: 57.7)
                val = (valeur * 100) if abs(valeur) <= 1.5 else valeur
                s = f"{val:.1f}".rstrip('0').rstrip('.')
                return f"{s}%"
            s = f"{valeur:.2f}".rstrip('0').rstrip('.')
            return s

        # Détection format (nouveau si présence code/ordre)
        is_nouveau_format = any(
            (getattr(d.ligne, "code", None) or getattr(d.ligne, "ordre", None) is not None)
            for d in donnees
        )

        colonnes_principales = OrderedDict()

        # =====================================================================
        # NOUVEAU FORMAT (avec code/parent_code/ordre)
        # =====================================================================
        if is_nouveau_format:
            nodes_by_code = OrderedDict()

            # 1) Parcours des données -> colonnes groupées + noeuds
            for d in donnees:
                l = d.ligne
                label = (l.label or "").strip()
                col = (d.colonne or "").strip()

                # Colonnes groupées
                if "~" in col:
                    col_principal, col_sous = map(str.strip, col.split("~", 1))
                else:
                    col_principal, col_sous = col, ""
                if col_principal not in colonnes_principales:
                    colonnes_principales[col_principal] = []
                if col_sous and col_sous not in colonnes_principales[col_principal]:
                    colonnes_principales[col_principal].append(col_sous)
                elif not col_sous and "" not in colonnes_principales[col_principal]:
                    colonnes_principales[col_principal].append("")

                # Clés hiérarchie
                code = (l.code or "").strip() or f"__row_{l.id}"
                parent_code = (l.parent_code or "").strip()
                ordre = l.ordre if l.ordre is not None else None

                if code not in nodes_by_code:
                    nodes_by_code[code] = {
                        "code": code,
                        "parent_code": parent_code,
                        "indicateur": label,
                        "ordre": ordre,
                        "valeurs": defaultdict(dict),
                        "children": [],
                        "ligne_id": l.id,
                    }

                nodes_by_code[code]["valeurs"][col_principal][col_sous] = format_value(d.unite, d.valeur)

            # 2) Construire l’arbre
            roots = []
            for code, node in nodes_by_code.items():
                p = node.get("parent_code")
                if p and p in nodes_by_code:
                    nodes_by_code[p]["children"].append(node)
                else:
                    roots.append(node)

            # 3) Aplatir avec tri et niveau
            def has_any_value(n):
                return any(v for g in n["valeurs"].values() for v in g.values())

            def flatten(nodes, niveau=0):
                out = []
                nodes_sorted = sorted(
                    nodes,
                    key=lambda n: (
                        n.get("ordre") is None,                # ceux sans ordre en dernier
                        n.get("ordre", 0),
                        n.get("indicateur", "")
                    )
                )
                for n in nodes_sorted:
                    out.append({
                        "indicateur": n["indicateur"],
                        "valeurs": dict(n["valeurs"]),
                        "niveau": niveau,
                        "ordre": n.get("ordre"),
                        "code": n.get("code"),
                        "parent_code": n.get("parent_code") or None,
                        "ligne_id": n.get("ligne_id"),
                        "is_section": (len(n["children"]) > 0 and not has_any_value(n)),
                    })
                    out.extend(flatten(n["children"], niveau + 1))
                return out

            data = flatten(roots)

            # 4) Colonnes groupées + ordre à plat
            colonnes_groupées = {
                col: sous if any(sous) else [""]
                for col, sous in colonnes_principales.items()
            }
            colonnes_order = []
            for gp, sous in colonnes_principales.items():
                if any(sous):
                    for s in sous:
                        colonnes_order.append({"principal": gp, "sous": s})
                else:
                    colonnes_order.append({"principal": gp, "sous": ""})

            return Response({
                "colonnes_groupées": colonnes_groupées,
                "colonnes_order": colonnes_order,
                "data": data,
                "has_sous_indicateurs": False,  # <- nouveau format
                "meta": {
                    "titre": tableau.titre,
                    "source": tableau.source or "",
                    "etiquette_ligne": tableau.etiquette_ligne or ""
                },
                "format": "nouveau"
            })

        # =====================================================================
        # ANCIEN FORMAT (séparateur ~ dans lignes/colonnes)
        # =====================================================================
        structure = OrderedDict()

        for d in donnees:
            label = (d.ligne.label or "").strip()
            col = (d.colonne or "").strip()

            # Colonnes groupées
            if "~" in col:
                col_principal, col_sous = map(str.strip, col.split("~", 1))
            else:
                col_principal, col_sous = col, ""
            if col_principal not in colonnes_principales:
                colonnes_principales[col_principal] = []
            if col_sous and col_sous not in colonnes_principales[col_principal]:
                colonnes_principales[col_principal].append(col_sous)
            elif not col_sous and "" not in colonnes_principales[col_principal]:
                colonnes_principales[col_principal].append("")

            v = format_value(d.unite, d.valeur)

            # Lignes groupées (~)
            if "~" in label:
                principal, sous = map(str.strip, label.split("~", 1))
                if principal not in structure:
                    structure[principal] = {
                        "sous_indicateurs": [],
                        "valeurs": defaultdict(dict)
                    }
                structure[principal]["sous_indicateurs"].append({
                    "nom": sous,
                    "valeurs": {col_principal: {col_sous: v}}
                })
            else:
                if label not in structure:
                    structure[label] = {
                        "sous_indicateurs": [],
                        "valeurs": defaultdict(dict)
                    }
                structure[label]["valeurs"][col_principal][col_sous] = v

        # Colonnes groupées + ordre à plat
        colonnes_groupées = {
            col: sous if any(sous) else [""]
            for col, sous in colonnes_principales.items()
        }
        colonnes_order = []
        for gp, sous in colonnes_principales.items():
            if any(sous):
                for s in sous:
                    colonnes_order.append({"principal": gp, "sous": s})
            else:
                colonnes_order.append({"principal": gp, "sous": ""})

        # Aplatir pour le front
        data = []
        for indicateur, contenu in structure.items():
            if contenu["sous_indicateurs"]:
                regroupé = OrderedDict()
                for sous in contenu["sous_indicateurs"]:
                    nom = sous["nom"]
                    if nom not in regroupé:
                        regroupé[nom] = defaultdict(dict)
                    for c, sous_vals in sous["valeurs"].items():
                        for sc, val in sous_vals.items():
                            regroupé[nom][c][sc] = val
                data.append({
                    "indicateur": indicateur,
                    "sous_indicateurs": [
                        {"nom": nom, "valeurs": regroupé[nom]}
                        for nom in regroupé
                    ],
                    "niveau": 0,
                    "ordre": None,
                    "code": None,
                    "parent_code": None,
                    "ligne_id": None,
                    "is_section": False
                })
            else:
                data.append({
                    "indicateur": indicateur,
                    "valeurs": dict(contenu["valeurs"]),
                    "niveau": 0,
                    "ordre": None,
                    "code": None,
                    "parent_code": None,
                    "ligne_id": None,
                    "is_section": False
                })

        has_sous_indicateurs = any(row.get("sous_indicateurs") for row in data)

        return Response({
            "colonnes_groupées": colonnes_groupées,
            "colonnes_order": colonnes_order,
            "data": data,
            "has_sous_indicateurs": has_sous_indicateurs,  # True pour ancien format quand il y a des sous-indicateurs
            "meta": {
                "titre": tableau.titre,
                "source": tableau.source or "",
                "etiquette_ligne": tableau.etiquette_ligne or ""
            },
            "format": "ancien"
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
