from django.core.management.base import BaseCommand
from ansade_app.models import Tableau
import re

class Command(BaseCommand):
    help = "Ajoute le préfixe ANSADE/ aux sources appartenant au groupe ANSADE"

    ANSADE_GROUPS = {
        "RGPH", "RGPH, MICS et EDSM", "RGPH et EDSM",
        "EPCV", "MICS", "EDSM", "ICC", "PIB", "INPC","CN",
    }

    def clean_text(self, text):
        text = text.lower()
        text = re.sub(r"[^\w\s]", " ", text)
        text = re.sub(r"\s+", " ", text).strip()
        return text

    def detect_group(self, text):
        """Même logique que ton API GroupedSourcesAutoAPIView"""
        txt = self.clean_text(text)

        # Combos
        if all(k in txt for k in ["rgph", "mics", "edsm"]):
            return "RGPH, MICS et EDSM"
        if all(k in txt for k in ["rgph", "edsm"]):
            return "RGPH et EDSM"

        # Simples
        if "rgph" in txt:
            return "RGPH"
        if "epcv" in txt:
            return "EPCV"
        if "mics" in txt:
            return "MICS"
        if "edsm" in txt:
            return "EDSM"
        if "icc" in txt:
            return "ICC"
        if "pib" in txt:
            return "PIB"
        if "inpc" in txt:
            return "INPC"
        if "cn" in txt:
            return "CN"

        return None

    def handle(self, *args, **options):
        tableaux = Tableau.objects.all()
        count = 0

        for t in tableaux:
            source = t.source or ""
            group = self.detect_group(source)

            # appartient au groupe ANSADE
            if group in self.ANSADE_GROUPS:
                # ne commence PAS par ANSADE/
                if not source.strip().lower().startswith("ansade/"):
                    t.source = f"ANSADE/{source.strip()}"
                    t.save()
                    count += 1

        self.stdout.write(self.style.SUCCESS(f"{count} sources mises à jour."))
