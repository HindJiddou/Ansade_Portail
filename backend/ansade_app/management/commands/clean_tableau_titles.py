from django.core.management.base import BaseCommand
from ansade_app.models import Tableau, Theme
import re


class Command(BaseCommand):
    help = "Remplace ',' et ';' par un espace dans les titres des tableaux du thème Démographie"

    def handle(self, *args, **options):
        try:
            theme = Theme.objects.get(nom_theme__iexact="Education")
        except Theme.DoesNotExist:
            self.stderr.write(
                self.style.ERROR("❌ Le thème 'Démographie' n'existe pas")
            )
            return

        tableaux = Tableau.objects.filter(theme=theme)
        total = tableaux.count()
        modified = 0

        for tableau in tableaux:
            original = tableau.titre or ""

            # 🔹 Remplacer , et ; par espace
            cleaned = re.sub(r"[;,]", " ", original)

            # 🔹 Nettoyer les espaces multiples
            cleaned = re.sub(r"\s+", " ", cleaned).strip()

            if original != cleaned:
                tableau.titre = cleaned
                tableau.save(update_fields=["titre"])
                modified += 1

        self.stdout.write(self.style.SUCCESS(
            f"✅ Thème Démographie : {modified}/{total} titres modifiés"
        ))
