---
title: "Sécurisation d'une Application Web & Pipeline DevSecOps (Mininotes)"
description: "Mise en œuvre d'une chaîne CI/CD sécurisée de bout en bout : modélisation des menaces STRIDE, SAST/SCA/DAST, signature Cosign SLSA L2 et déploiement Staging/Prod."
year: 2026
role: "Mission DevSecOps (Équipe de 5) — EPITA"
categories: ["DevSecOps / DevOps"]
stack: ["Python / Flask", "GitLab CI", "Docker", "Semgrep", "Grype", "Trivy", "Cosign", "OWASP ZAP", "STRIDE"]
repoUrl: "https://github.com/piaw-cavarec"
featured: false
comingSoon: false
---

## Problématique & Contexte

Le projet **Mininotes** consistait à reprendre une application Web Python/Flask vulnérable et à concevoir une chaîne **DevSecOps intégrale**, de la modélisation initiale des menaces jusqu'au déploiement sécurisé en production.

L'objectif principal était d'automatiser les contrôles de sécurité à chaque étape du cycle de vie logiciel (*Shift-Left Security*) sans ralentir les livraisons, en instaurant des **portes de qualité bloquantes** (*Quality Gates*) et une chaîne d'approvisionnement logicielle vérifiable (**SLSA Level 2**).

---

## Modélisation des Menaces STRIDE & Cartographie (DFD)

Avant d'écrire la moindre ligne de code ou de correctif, une analyse des menaces selon le modèle **STRIDE** a été réalisée sur le Data Flow Diagram (DFD) de l'application :

```text
+--------------+   Req. HTTP   +-----------------+   Req. SQL   +---------------+
|  Utilisateur | ------------> |   App Flask     | -----------> |  Base SQLite  |
|   (Acteur)   |               |   (Processus)   |              |  (Stockage)   |
+--------------+               +-----------------+              +---------------+
                                       |
                                       | Lecture / Écriture
                                       v
                               +-----------------+
                               |  Uploads / FS   |
                               +-----------------+
```

### Bilan de l'évaluation initiale (19 vulnérabilités)

- **3 Critiques** : Injection SQL permettant le bypass d'authentification (CWE-89), élévation de privilèges via mass assignment `is_admin` à l'inscription (CWE-269), exécution de code à distance (RCE) via désérialisation non sécurisée `yaml.load()`.
- **7 Élevées** : Faille IDOR sur l'accès aux notes privées (CWE-639), hachage des mots de passe en MD5 sans sel, absence de jetons CSRF sur les formulaires sensibles.
- **7 Moyennes & 2 Faibles** : Absence de rate-limiting sur le login, fuite d'informations en-têtes HTTP, faiblesses Dockerfile.

---

## Architecture de la Chaîne CI/CD (11 Jobs / 7 Étapes)

Le pipeline de CI/CD GitLab a été découpé en 7 étapes séquentielles avec exécution parallèle des scanners statiques :

```text
[ Stage 1: Scan ] ──> [ Stage 2: Build ] ──> [ Stage 3: Scan Image ] ──> [ Stage 4: Sign ] ──> [ Stage 5: Staging ] ──> [ Stage 6: DAST ] ──> [ Stage 7: Prod ]
 (semgrep, gitleaks    (docker build         (trivy:image)               (cosign attest      (rsync + SSH           (OWASP ZAP         (Déploiement
  syft, hadolint)       dind + digest)                                    SLSA L2)            deploy staging)        baseline)          manuel contrôlé)
```

### 1. Scans Statiques & Qualité (Stage Scan & SCA)
- **SAST (`sast:semgrep`)** : Analyse statique du code source Python (`semgrep --config auto`).
- **Secrets (`secrets:gitleaks`)** : Détection de clés d'API et secrets commités en clair (`gitleaks detect`).
- **Linters Docker (`lint:hadolint`)** : Vérification des bonnes pratiques du `Dockerfile`.
- **SBOM (`sbom:syft`)** : Génération de l'inventaire logiciel (*Software Bill of Materials*) au format CycloneDX.
- **SCA (`sca:grype`)** : Scan de vulnérabilités des dépendances Python croisé avec le SBOM généré (`grype sbom:sbom.cdx.json --fail-on high`).

### 2. Build de l'Image Conteneur & Scan d'Image
- **Build par Digest (`image:build`)** : Construction Docker-in-Docker (`dind`) basée sur une image `python:3.12-slim` durcie (exécutée sous utilisateur non-root `appuser`).
- **Scan de Conteneur (`trivy:image`)** : Scan de l'image construite par digest avec gate bloquant (`--severity HIGH,CRITICAL --exit-code 1`). **Résultat : 0 vulnérabilité résiduelle High/Critical**.

### 3. Signature & Attestation de Provenance (SLSA Level 2)
- **Signature Cosign (`attest-provenance-l2`)** : Génération d'une attestation de provenance signée via **Cosign** (`cosign attest --type slsaprovenance1`).
- **Admission Contrôlée** : Vérification de la signature (`cosign verify-attestation`) **avant chaque déploiement** sur Staging ou Production.

### 4. Déploiement Staging & DAST
- **Staging** : Déploiement automatique sur la VM Staging via SSH/rsync et `docker compose up -d` par digest immuable.
- **DAST (`dast:zap-baseline`)** : Scan dynamique actif avec **OWASP ZAP Baseline** ciblant l'environnement de staging. **Résultat : 0 alerte de sécurité résiduelle (4 avertissements analysés comme faux-positifs)**.

### 5. Production Contrôlée (Human-in-the-loop)
- **Déploiement Prod** : Déclenché uniquement de manière **manuelle** sur la branche `main` protégée après validation de l'ensemble des scans et vérification de l'attestation `cosign`.

---

## Correctifs Appliqués & Résultats

| Faille Identifiée | Avant (Code Vulnérable) | Après (Code Durci) |
|---|---|---|
| **Injection SQL (`AUTH-01`)** | `"SELECT * FROM users WHERE username='" + username` | `WHERE username = ?` *(Requêtes paramétrées SQLite)* |
| **Hachage Mots de passe** | `hashlib.md5(p).hexdigest()` | `werkzeug.security.generate_password_hash` *(PBKDF2 salé)* |
| **Désérialisation RCE** | `yaml.load(file.read())` | `yaml.safe_load(file.read())` |
| **Protection CSRF** | Formulaires sans jeton | Intégration `Flask-WTF` + jetons CSRF systématiques |
| **En-têtes de Sécurité** | En-têtes HTTP par défaut | Ajout de `CSP`, `X-Frame-Options`, `X-Content-Type-Options: nosniff`, `SameSite=Lax` |

---

## Bilan de la Posture de Sécurité

```text
AVANT LA MISSION                                 APRÈS LA MISSION
+------------------------------------+          +------------------------------------+
| 19 Vulnérabilités (3 Crit., 7 Élev)|  ----->  | 0 Alerte ZAP DAST / 0 Vuln High    |
| Authentification vulnérable SQLi   |          | Chaîne CI/CD à 11 jobs bloquants   |
| Mots de passe en MD5 sans sel      |          | Image conteneur signée Cosign SLSA2|
| Aucun contrôle de sécurité en CI   |          | Déploiement par Digest Immuable    |
+------------------------------------+          +------------------------------------+
```
