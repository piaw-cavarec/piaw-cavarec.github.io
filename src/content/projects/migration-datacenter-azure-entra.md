---
title: "Migration Datacenter & Active Directory vers Azure (Étude Théorique)"
description: "Étude d'architecture et cadrage stratégique d'une migration cloud hybride Zero Trust : bascule AD DS vers Entra ID, segmentation VNET et chiffrage TCO sur 3 ans."
year: 2026
role: "Projet d'Architecture & Cadrage Théorique (Équipe de 3) — EPITA"
categories: ["Cloud & Identité", "DevSecOps / DevOps"]
stack: ["Azure", "Entra ID", "Microsoft Intune", "Active Directory", "Zero Trust", "VPN S2S", "Azure Backup / ASR", "TCO / OPEX"]
repoUrl: "https://github.com/piaw-cavarec"
featured: false
comingSoon: false
---

> **Avertissement :** Ce projet constitue une **étude d'architecture et un cadrage stratégique théorique** élaboré dans le cadre de la majeure SecDevOps/BuildSec à l'EPITA. La migration n'a pas été déployée techniquement en environnement de production réel.

## Problématique & Contexte

L'entreprise fictive **ECORP** (230 salariés répartis sur 2 sites principaux avec des équipements Datacenter on-premise vieillissants) souhaitait moderniser son système d'information.

L'objectif de cette étude était de concevoir le dossier d'architecture technique (HLD/LLD) et la feuille de route financière pour migrer l'ensemble des services vers le cloud **Microsoft Azure** et basculer l'annuaire historique **Active Directory (AD DS)** vers **Entra ID**, selon les principes de **sécurité par conception (*Security by Design*) et du modèle Zero Trust**.

---

## Architecture Cible & Transformation d'Identité

La stratégie privilégie une approche progressive en 2 temps (Transition hybride puis cible 100% Cloud-Only) pour éviter toute rupture de service :

```text
[ Infrastructure On-Premise (Existant) ]            [ Architecture Cible (Cloud Azure) ]
• Annuaire AD DS (Kerberos/LDAP/GPO)                • Entra ID (IdP central, OAuth2/OIDC/SAML)
• Serveurs Web & Bases de données                   • Microsoft Intune (Gestion des postes à distance)
• Pare-feux pfSense & Stockage GlusterFS  ───>      • Subnets segmentés (Web/App/Data/Mgmt) + NSG
• Bastion Guacamole & Vault secrets                 • Azure Bastion + VPN S2S + Azure Firewall
• Supervision Grafana & Wazuh SIEM                  • Azure Backup + Azure Site Recovery (ASR)
```

### Transformation du Modèle d'Identité (AD DS → Entra ID)

La migration de l'annuaire ne consiste pas en une simple copie, mais en une refonte complète du modèle d'accès :
- **Authentification & Accès Conditionnel** : Imposition du MFA obligatoire et règles de *Conditional Access* basées sur le risque.
- **Gestion du Parc** : Remplacement des stratégies de groupe (GPO) par **Microsoft Intune** pour le pilotage à distance des postes de travail.
- **Compatibilité Applicative** : Maintien temporaire d'*Entra Domain Services* uniquement pour les applications legacy requérant du LDAP/Kerberos.

---

## LLD Réseau & Sécurité par Défaut (Zero Trust)

L'architecture réseau Azure (`VNET 10.x.0.0/16`) applique le principe du **moindre privilège réseau (*POLP*) et du "Deny par défaut"** :

```text
+-----------------------------------------------------------------------------------+
|                                 VNET AZURE (10.x.0.0/16)                          |
|                                                                                   |
|  [ Subnet Web (10.x.1.0/24) ]   --> NSG DENY (Front applicatif)                   |
|  [ Subnet App (10.x.2.0/24) ]   --> NSG DENY (Logique métier)                     |
|  [ Subnet Data (10.x.3.0/24) ]  --> NSG DENY (Bases de données)                  |
|  [ Subnet Mgmt (10.x.10.0/24) ] --> NSG DENY (Administration)                     |
+-----------------------------------------------------------------------------------+
       ^                                 ^                                 ^
       |                                 |                                 |
 [ Azure Bastion ]             [ VPN Site-to-Site ]               [ Azure Firewall ]
  Admin sécurisé                Tunnels chiffrés                   Filtrage sortant
```

- **Passerelle VPN Site-to-Site (S2S)** : Tunnels chiffrés reliant les sites physiques à Azure.
- **Azure Bastion** : Administration à distance sécurisée sans exposition des ports RDP/SSH sur Internet.
- **Supervision & PRA** : Centralisation de la journalisation sous **Wazuh + Microsoft Sentinel** et réplication inter-région via **Azure Backup & Azure Site Recovery (ASR)** (objectifs métier : RPO 4h, RTO 2h).

---

## Modèle Économique & Chiffrage Financier (TCO 3 ans)

L'un des axes majeurs de l'étude consistait à cadrer le basculement d'un modèle **CAPEX** (achats de matériels et licences immobilisées) vers un modèle **OPEX** (consommation à l'usage prévisible).

### Synthèse du Chiffrage TCO (770 k€ sur 3 ans)

| Poste de Dépense | Détail Technique & Hypothèses | Montant Estimé |
|---|---|---|
| **BUILD (Projet)** | ~180 j/h de conseil, ingénierie, Landing Zone, VPN, tests & conduite du changement (TJM ~950 €) | **170 000 €** |
| **RUN (Année 1)** | Licences identity (M365 Business Premium + E5 admins) + Usage Azure compute/storage/network | **200 000 €** |
| **RUN (Année 2)** | OPEX récurrent | **200 000 €** |
| **RUN (Année 3)** | OPEX récurrent | **200 000 €** |
| **TOTAL TCO 3 ANS** | **Coût lissé de ~257 000 € / an** | **770 000 €** |

### Analyse des Gains & Coûts Évités

L'étude met en évidence que la justification économique repose sur un modèle mixte :
- **Renouvellement matériel Datacenter évité** : ~20 à 30 k€/an (CAPEX).
- **Contrats de maintenance & support on-prem évités** : ~12 à 15 k€/an (OPEX).
- **Électricité, climatisation & hébergement évités** : ~6 à 10 k€/an (OPEX).
- **Gains intangibles** : Réduction majeure des risques de rupture de service via la redondance multi-zones cloud.
