import json
from datetime import date
from ansade_app.models import (
    Categorie, Theme, Tableau, LigneIndicateur, Donnees
)

with open("statistiques_economiques_clean.json", encoding="utf-8") as f:
    data = json.load(f)

# 1️⃣ Catégorie
categorie, _ = Categorie.objects.get_or_create(
    nom_cat=data["categorie"]
)

# 2️⃣ Thèmes, tableaux, lignes, données
for theme_data in data["themes"]:
    theme, _ = Theme.objects.get_or_create(
        nom_theme=theme_data["nom_theme"],
        categorie=categorie
    )

    for t_data in theme_data["tableaux"]:
        tableau, _ = Tableau.objects.get_or_create(
            titre=t_data["titre"],
            theme=theme,
            defaults={
                "nom_feuille": t_data["nom_feuille"],
                "etiquette_ligne": t_data["etiquette_ligne"],
                "source": t_data["source"],
                "date_verrouillage": (
                    date.fromisoformat(t_data["date_verrouillage"])
                    if t_data["date_verrouillage"]
                    else None
                )
            }
        )

        # 🔹 lignes indicateurs
        lignes_map = {}
        for l in t_data["lignes"]:
            ligne = LigneIndicateur.objects.create(
                tableau=tableau,
                label=l["label"],
                code=l["code"],
                parent_code=l["parent_code"],
                ordre=l["ordre"]
            )
            lignes_map[l["code"]] = ligne

        # 🔹 données
        for d in t_data["donnees"]:
            Donnees.objects.create(
                tableau=tableau,
                categorie=categorie,
                ligne=lignes_map.get(d["ligne_code"]),
                colonne=d["colonne"],
                valeur=d["valeur"],
                unite=d["unite"],
                statut=d["statut"],
                note_colonne=d["note_colonne"],
                source=d["source"]
            )

print("✅ Import Statistiques Economiques (local) terminé")
