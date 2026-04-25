# EasyCom HQ — Équipe IA

Site : **easycom-world.ch** | Tag Amazon : **easycom0ae-21**
CEO Chat ID Telegram : **1921851243**

---

## L'équipe

| Agent | Rôle | Canal principal | Statut |
|-------|------|-----------------|--------|
| 🎬 IZZY | Contenu TikTok | TikTok / Notion | Actif |
| 🤖 ELION | Conseiller site web | Site (Gemini) | Actif |
| 💰 RICO | Comptabilité & finances | Notion / Telegram | À activer |
| 📧 MAYA | Emails & relances | Infomaniak SMTP | À activer |
| 🛒 CARTER | Relances paniers abandonnés | Email / Telegram | À créer |
| ⚖️ LEX | Juridique & conformité | Notion / Docs | À créer |
| 🎯 CLOSER | Closing & conversion | Elion (scripts) | À intégrer |
| 💬 SARA | Service client difficile | Email / TikTok | À activer |

---

## Flux de données

```
Visiteur site
    → Elion (conseille, répond)
    → Clic Amazon (tag easycom0ae-21)
        → Commission → RICO (log Notion)
        → Email confirmation → MAYA

Follower TikTok
    → Izzy (contenu)
    → Commentaire difficile → SARA
    → Hésitation prix → CLOSER

Email entrant
    → MAYA (réponse auto)
    → Si urgent → Telegram CEO

Fin de journée
    → RICO agrège les chiffres
    → Telegram CEO 23h (bilan)
```

---

## Tableau de bord Telegram CEO

| Heure | Émetteur | Contenu |
|-------|----------|---------|
| 8h00 | RICO | Rapport quotidien |
| Temps réel | RICO | Nouvelle vente Amazon |
| Temps réel | MAYA | Email entrant important |
| 18h00 | IZZY | Script du jour à valider |
| 23h00 | RICO | Bilan journée |

---

## Fichiers de référence par agent

| Agent | Fichier |
|-------|---------|
| IZZY | `agents/izzy/IZZY_PERSONA.md` + `agents/izzy/scripts.md` |
| ELION | `agents/elion/README.md` |
| RICO | `agents/rico/RICO.md` |
| MAYA | `agents/maya/MAYA.md` + `agents/infomaniak/EMAIL_SETUP.md` |
| CARTER | `agents/carter/CARTER.md` |
| LEX | `agents/lex/LEX.md` |
| CLOSER | `agents/closer/CLOSER.md` |
| SARA | `agents/sara/SARA.md` |
