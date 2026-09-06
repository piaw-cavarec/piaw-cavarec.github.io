---
title: "Audit de Sécurité Matérielle & Firmware (IoT)"
description: "Évaluation complète en conditions boîte noire d'un équipement connecté d'intérieur : cartographie PCB, dump Flash SPI, analyse statique du firmware et cotation CVSS v3.1."
year: 2026
role: "Audit de Sécurité & Rétro-ingénierie — EPITA"
categories: ["Hardware & Embarqué", "Cyber & Reverse"]
stack: ["Ghidra", "Binwalk", "SPI Flash NOR", "UART Probing", "Linux Embarqué", "MIPS32", "CVSS v3.1"]
repoUrl: "https://github.com/piaw-cavarec"
featured: true
comingSoon: false
---

> **Avis de confidentialité & déontologie :** Conformément aux règles d'éthique en cybersécurité et de protection de la propriété intellectuelle, les références exactes du constructeur, du modèle commercial, du PCB et des numéros de série des composants ont été anonymisées.

## Problématique & Contexte

L'objectif de cette mission d'audit réalisée en conditions **boîte noire** (sans documentation ni schématiques fournis) consistait à évaluer la posture de sécurité globale d'un équipement connecté d'intérieur (vidéosurveillance IP PTZ). 

L'analyse combine l'inspection matérielle physique de la carte électronique, l'extraction des mémoires non volatiles, l'analyse statique du micrologiciel (firmware de 8 Mo) et la cotation standardisée des risques selon la grille **CVSS v3.1** (référentiels OWASP IoT Top 10, ANSSI et ETSI EN 303 645).

---

## Cartographie Matérielle & Ingestion Physique

L'inspection recto/verso du circuit imprimé (PCB) a permis de cartographier la surface d'attaque physique :

- **Processeur principal (SoC)** : Architecture MIPS32 rel2 exécutant un noyau Linux embarqué. Composant dépourvu d'enrobage époxy.
- **Mémoire NOR Flash SPI (8 Mo, boîtier SOP8)** : Stockage principal contenant l'intégralité de l'image firmware en clair (partitions `rootfs` SquashFS, `/app` SquashFS, et `/conf` JFFS2).
- **EEPROM I²C (16 Ko, boîtier SOIC8)** : Mémoire non volatile chiffrée au repos (point positif de sécurité matérielle relevé).
- **Interface de débogage UART (TX/RX/GND)** : Port série exposé et étamé sur le PCB, configuré à 115 200 bauds.
- **Module Wi-Fi & Antennes U.FL** : Connectivité réseau sans fil.

---

## Méthodologie d'Anonymisation & Étapes de l'Audit

```text
+-----------------------+     +-----------------------+     +-----------------------+     +-----------------------+
|  Phase 1 : Reconnaiss.| --> |  Phase 2 : Extraction | --> |  Phase 3 : Analyse    | --> |  Phase 4 : Remédiation|
|  Inspection PCB & UART|     |  Dump NOR Flash SPI   |     |  Ghidra & Binwalk     |     |  CVSS v3.1 & Roadmap  |
+-----------------------+     +-----------------------+     +-----------------------+     +-----------------------+
```

1. **Reconnaissance & Probing** : Identification des boîtiers (SOP8, SOIC8), repérage des bus de communication et branchement d'un analyseur logique / convertisseur USB-UART.
2. **Dessoudage & Extraction (Dump)** : Retrait de la mémoire Flash SPI NOR à l'air chaud et lecture directe du contenu binaire sur programmateur universel.
3. **Décompilation & Analyse statique** : Extraction de l'arborescence du système de fichiers via `Binwalk` et rétro-ingénierie des binaires applicatifs sous `Ghidra` et `Radare2`.
4. **Cotation des vulnérabilités** : Quantification des risques selon la formule de criticité : **Score = Impact × Vraisemblance**.

---

## Synthèse des 13 Constats de Sécurité

Au terme de l'analyse, **13 constats de sécurité** ont été identifiés avec un niveau de risque global **ÉLEVÉ** :

| ID | Domaine | Gravité (CVSS v3.1) | Constat & Description Synthétique |
|---|---|---|---|
| **AUTH-01** | Authentification | **Critique (20/25)** | Hash root MD5crypt ($1$) partagé sur l'ensemble du parc et cassable hors-ligne via GPU. |
| **OS-01** | Noyau Linux | **Critique (16/25)** | Noyau Linux 3.10.14 en fin de vie (EOL) vulnérable à Dirty COW (CVE-2016-5195) sans ASLR/PIE. |
| **CRY-01** | Cryptographie | **Élevé (12/25)** | Clés privées client et certificats TLS conservés en clair sur la partition inscriptible `/conf`. |
| **HW-02** | Mémoires | **Élevé (12/25)** | Flash SPI NOR lisible et réinscriptible sans aucune protection physique ni Secure Boot. |
| **HW-01** | Interfaces | **Élevé (9/25)** | Port UART de débogage ouvert donnant un accès console root direct dès le démarrage. |
| **NET-01** | Services | **Élevé (9/25)** | Démon Telnet présent dans l'image de production et réactivable via un script d'init. |
| **CLD-01** | Cloud / OTA | **Élevé (8/25)** | Adresses IP cloud codées en dur appelées en transport HTTP non chiffré. |

---

## Plan de Remédiation Priorisé

Les actions correctives sont structurées sous forme de tableaux récapitulatifs organisés par horizons temporels :

### 1. Actions Immédiates — 0 à 30 jours (Release OTA)

| Constat | Intitulé Action | Recommandation Technique | Prio. | Effort |
|---|---|---|---|---|
| **AUTH-01** | Hachage Root | Migrer vers *yescrypt / SHA-512-crypt* avec secret unique par appareil | **P0** | Faible |
| **CRY-01** | Certificats Client | Chiffrer `/conf` et restreindre les permissions système des clés | **P0** | Moyen |
| **HW-01** | Console Série | Désactiver `getty` dans `/etc/inittab`, masquer la console & protéger le bootloader | **P1** | Faible |
| **NET-01** | Suppression Telnet | Retirer le binaire `telnetd` et les scripts d'activation des images prod | **P1** | Faible |
| **CLD-01** | Transport HTTPS | Retirer les IP brutes en dur, imposer HTTPS + validation du certificat TLS | **P1** | Faible |
| **CRY-03** | Nœud `/dev/mem` | Restreindre ou supprimer l'accès direct au nœud `/dev/mem` | **P1** | Faible |
| **HW-05** | Écriture Flash | Activer la protection d'écriture matérielle (broche `WP` & verrouillage blocs) | **P1** | Faible |
| **OTA-01** | Durcissement OTA | Valider rigoureusement la signature des images et intégrer un anti-rollback | **P1** | Moyen |

---

### 2. Actions à Court / Moyen Terme — 1 à 3 mois

| Constat | Intitulé Action | Recommandation Technique | Prio. | Effort |
|---|---|---|---|---|
| **CRY-02** | Rétro-ingénierie IPC | Qualifier les MD5 et auditer `gv_exec` ; retirer les secrets statiques | **P2** | Moyen |
| **OS-01** | CVE Noyau | Répertorier les CVE et appliquer les rétroportages disponibles auprès du fournisseur SoC | **P2** | Moyen |
| **NET-01** | Intégrité au boot | Interdire l'exécution de scripts non signés depuis la partition `/conf` | **P2** | Moyen |
| **CLD-01** | Endpoints Cloud | Centraliser la configuration des endpoints via découverte signée et révocable | **P2** | Moyen |
| **CLD-02** | Provisionnement | Authentifier et chiffrer l'échange d'appairage initial (AP/BLE) | **P3** | Moyen |

---

### 3. Actions de Fond & Refonte Produit — 3 à 12 mois

| Constat | Intitulé Action | Recommandation Technique | Prio. | Effort |
|---|---|---|---|---|
| **OS-01** | Migration Noyau LTS | Migrer vers un noyau LTS maintenu avec MAJ `libc`/`BusyBox` & mitigations (`ASLR`, `PIE`, `RELRO`) | **P2** | Élevé |
| **HW-02/05** | Secure Boot | Implémenter le Secure Boot avec stockage chiffré ancré dans une racine de confiance matérielle (`eFuse`) | **P2** | Élevé |
| **CRY-01** | Élément Sécurisé | Dédié (`TPM` / `Secure Element`) à la conservation inviolable des clés et à la rotation | **P2** | Élevé |
| **HW-04** | Protection PCB | Enrobage époxy et abrasage des marquages des composants sensibles | **P3** | Faible |
| **Global** | Conformité ETSI/CRA | Programme de conformité ETSI EN 303 645 / CRA et réévaluation périodique | **P3** | Moyen |
