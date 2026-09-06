---
title: "Assemblage & Configuration Hardware d'un Framework Laptop 13"
description: "Montage sur-mesure d'un ordinateur portable modulaire et réparable Framework Laptop 13 : architecture Intel Core Ultra 5 325, mémoire LPCAMM2 LPDDR5X, écran 2.8K tactile, bezel vert translucide et clavier Blank ANSI."
year: 2026
role: "Projet Hardware & Assemblage DIY"
categories: ["Hardware & Embarqué"]
stack: ["Framework 13", "Intel Core Ultra 5", "LPCAMM2 LPDDR5X", "Linux", "Hardware DIY", "Modular Architecture"]
featured: true
comingSoon: false
---

## Problématique & Philosophie du Projet

Le choix du **Framework Laptop 13 (DIY Edition)** s'inscrit dans une démarche de maîtrise intégrale du matériel informatique, de durabilité et de soutien au mouvement du *Right to Repair* (droit à la réparation). 

Contrairement aux ultraportables modernes intégrant des composants entièrement soudés (RAM, SSD, puces Wi-Fi), la plateforme Framework propose une architecture 100 % démontable, évolutive et réparable, permettant d'analyser l'intégration physique des sous-systèmes matériels et d'effectuer l'assemblage composant par composant.

---

## Fiche Technique & Composants Sélectionnés

La configuration a été spécifiée pour offrir un équilibre optimal entre puissance de calcul bas niveau, autonomie et réparabilité :

| Composant | Spécification choisie | Caractéristiques & Intérêt matériel |
| :--- | :--- | :--- |
| **Processeur (SoC)** | Intel Core Ultra 5 325 | Architecture hybride (4 P-Cores + 4 E-Cores, jusqu'à 4.5 GHz), NPU dédié, batterie 74Wh |
| **Mémoire RAM** | LPCAMM2 - LPDDR5X 16 GB | Nouveau standard de mémoire modulaire ultra-rapide, vissé et remplaçable |
| **Écran** | 2.8K Touchscreen Display | Dalle haute résolution à écran tactile et haute fidélité colorimétrique |
| **Personnalisation Bezel** | Translucent Green | Cadre magnétique vert translucide style rétro/engineering |
| **Clavier** | Blank ANSI — Graphite | Clavier mécanique vierge sans sérigraphie (dactylographie à l'aveugle) |
| **Cartes d'extension** | USB-C (Orange translucide), USB-A (Gen 2), HDMI (Gen 3) | Connecteurs modulaires interchangeables à chaud (Hot-swap sur bus PCIe/USB4) |
| **Outillage fourni** | Framework Screwdriver | Tournevis double embout (Torx T5 / PH0) et spudger d'ouverture |

---

## Étapes du Montage & Assemblage Pas-à-Pas

```text
+-----------------------+     +-----------------------+     +-----------------------+     +-----------------------+
| 1. Inspection Châssis | --> | 2. Installation RAM   | --> | 3. Connexion Input   | --> | 4. Pose Bezel & Cards |
| Déballage & Outillage |     | LPCAMM2 & Fixation    |     | Cover & Blank Keyboard|     | Tests BIOS & Boot Linux|
+-----------------------+     +-----------------------+     +-----------------------+     +-----------------------+
```

### 1. Ingestion du Châssis & Ouverture
- Ouverture du capot inférieur (*Input Cover*) à l'aide des vis imperdables Torx T5 et du tournevis officiel Framework.
- Déconnexion préventive du connecteur de batterie 74Wh pour garantir la sécurité électrique de la carte mère lors du montage.

### 2. Installation du Module LPCAMM2 (LPDDR5X)
- Insertion et alignement de la carte mémoire **LPCAMM2 (Low Power Compression Attached Memory Module)** sur le socket de la carte mère Intel Core Ultra 5.
- Serrage régulier des vis de maintien pour garantir une pression uniforme sur les contacts haute fréquence sans déformer le PCB.

### 3. Assemblage de l'Input Cover & Clavier Blank ANSI
- Fixation du clavier **Blank ANSI Graphite** dépourvu d'inscriptions sur les touches.
- Raccordement de la nappe souple du Touchpad et verrouillage du connecteur ZIF sur la carte mère.
- Rabattement de l'Input Cover et serrage des vis du châssis en alu usiné CNC.

### 4. Personnalisation Extérieure & Expansion Cards
- Clipssage du bezel magnétique **Translucent Green** autour de la dalle 2.8K tactile.
- Insertion des cartes d'extension modulaires dans les baies USB4/Thunderbolt 4 :
  - Port USB-C (Orange translucide) pour la charge USB-PD et l'affichage DisplayPort.
  - Port USB-A Gen 2 pour la connexion d'outils matériels (analyseurs logiques, sondes JTAG/UART).
  - Port HDMI Gen 3 pour la sortie vidéo directe sur moniteur externe.

---

## Déploiement Système & SecDevOps Ready

Après l'assemblage physique, l'ordinateur a été configuré avec un environnement de développement sécurisé :

- **Flashage UEFI / BIOS** : Activation du démarrage sécurisé (*Secure Boot*) et configuration du sous-système TPM 2.0.
- **Système d'Exploitation** : Installation d'une distribution Linux (Kernel récent 6.x) optimisée pour la gestion d'énergie de la batterie 74Wh et du GPU Intel Arc.
- **Chiffrement au repos** : Chiffrement intégral du disque SSD NVMe via LUKS2 avec clé scellée dans le TPM 2.0.
- **Tests de Charge & Stabilité** : Validation des températures en charge sous `stress-ng`, benchmark mémoire LPCAMM2 et vérification du support multi-écrans HDMI/USB-C.
