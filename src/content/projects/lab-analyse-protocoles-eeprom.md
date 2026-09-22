---
title: "Le lab d'analyse de protocoles avec microcontrôleur & EEPROM"
description: "Rapport d'évaluation technique & Journal de lab sur un week-end : sniffing passif I²C sur EEPROM 24LC256, cotation CVSS v3.1 (6.8), modélisation STRIDE et architecture Zero Trust on PCB."
year: 2026
role: "Audit Hardware & Rétro-Ingénierie (Lab Personnel)"
categories: ["Hardware & Embarqué", "Cyber & Reverse"]
stack: ["I²C", "EEPROM 24LC256", "ESP32-S3", "PulseView", "Sigrok", "Analyseur Logique", "PlatformIO / C++", "Audit Hardware", "CVSS v3.1", "STRIDE"]
liveUrl: "/docs/rapport-lab-analyse-i2c-eeprom.pdf"
repoUrl: "https://github.com/piaw-cavarec"
featured: false
comingSoon: false
---

> 📄 **RAPPORT TECHNIQUE**  
> **Évaluation de la Sécurité des Bus Inter-Composants : Sniffing Passif I²C, Rétro-Ingénierie de Mémoire EEPROM 24LC256 et Contre-Mesures Matérielles**  
> *Banc d'essai d'instrumentation & rétro-ingénierie de bus de communication* — Piaw CAVAREC (Septembre 2026)  
> 📥 **[Consulter / Télécharger le Rapport Technique Complet en PDF (23 pages, 511 Ko)](/docs/rapport-lab-analyse-i2c-eeprom.pdf)**

---

## 1. Synthèse Scientifique & Cadre d'Évaluation Matérielle

Ce projet formalise la caractérisation électrique, l'interception passive non-invasive et l'exfiltration de données sensibles transitant sur un bus inter-composants au niveau circuit imprimé (PCB). Il pose un cadre méthodologique pour la sécurisation des architectures matérielles IoT et industrielles.

### Fiche Technique de Synthèse du Banc d'Essai

| Paramètre | Spécification Technique / Description |
| :--- | :--- |
| **Cible d'Évaluation** | Mémoire EEPROM série I²C Microchip 24LC256 (Boîtier PDIP-8, 32 Ko) |
| **Composant Hôte (Maître)** | Espressif ESP32-S3 (Xtensa 32-bit Dual-Core @ 240 MHz, DevKitC-1) |
| **Protocole Analysé** | I²C (*Inter-Integrated Circuit*) en mode Standard (100 kHz) |
| **Instrumentation de Mesure** | Analyseur logique USB 8 canaux 24 MHz (driver open-source `fx2lafw`) |
| **Environnement Logiciel** | Suite Sigrok / PulseView, Framework PlatformIO sous VS Code (C++) |
| **Nature de l'Attaque** | Écoute passive de bus sur carte (*On-board Bus Sniffing*), physique, non-invasive |
| **Classification CVSS v3.1** | **6.8 (Gravité Moyenne / Impact Critique sur la Confidentialité)** |
| **Vecteur CVSS v3.1** | `CVSS:3.1/AV:P/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N` |

### Résumé Exécutif & Constat de Sécurité

Dans la conception des équipements électroniques (IoT, passerelles SCADA, dispositifs médicaux), les contraintes d'espace mémoire interne conduisent fréquemment à déporter des informations critiques (clés cryptographiques, certificats, jetons de session) sur des mémoires non-volatiles externes (EEPROM, Flash SPI).

Un biais de conception prédominant, désigné sous le terme de **Perimeter Defense Fallacy**, postule implicitement que le boîtier mécanique externe de l'appareil suffit à garantir l'inviolabilité des bus de communication circulant sur le circuit imprimé.

> **Résultat de l'évaluation :**  
> À l'aide d'un banc d'instrumentation à faible coût (< 25 €), l'intégralité du trafic échangé entre le microcontrôleur hôte et la mémoire externe a été capturé passivement et décodé sans laisser aucune trace physique ni perturber le fonctionnement opérationnel du système. La clé d'authentification simulée (`SECRET_KEY_1234`) a été exfiltrée en clair dès sa première transaction, démontrant une rupture totale de confidentialité.

### Schéma Fonctionnel du Vecteur d'Attaque

```text
+------------------------------------+                         +------------------------------------+
|        Microcontrôleur Hôte        |    Bus I²C en clair     |          EEPROM Externe            |
|       ESP32-S3 (Xtensa 240MHz)     | ----------------------> |     Microchip 24LC256 (PDIP-8)     |
+------------------------------------+    SDA / SCL @ 100 kHz  +------------------------------------+
                  |
                  | Sondage Passif Haute Impédance (1 MΩ // 10 pF)
                  v
+------------------------------------+
|        Analyseur Logique USB       |
|       8 Canaux / 24 MHz (fx2lafw)  |
+------------------------------------+
                  | Flux USB brut
                  v
+------------------------------------+
|         PulseView / Sigrok         |
|    Stacked Decoders : I²C + 24xx   |
+------------------------------------+
                  | Décodage immédiat
                  v
+------------------------------------+
|       Secret Exfiltré en Clair     |
|       "SECRET_KEY_1234" (ASCII)    |
+------------------------------------+
```

### Classification CVSS v3.1 & Modélisation des Menaces STRIDE

```text
================================================================================
                    NOTATION DE VULNÉRABILITÉ CVSS v3.1 : 6.8
================================================================================
• Attack Vector (AV:P)        : Physical. Contact électrique direct avec les broches.
• Attack Complexity (AC:L)    : Low. Aucune cryptographie complexe en l'absence de chiffrement.
• Privileges Required (PR:N)  : None. Aucun privilège requis sur l'OS ou le firmware.
• User Interaction (UI:N)     : None. Opère en totale autonomie dès la mise sous tension.
• Scope (S:U)                 : Unchanged. Restreint au composant mémoire.
• Confidentiality (C:H)       : High. Compromission totale des secrets transitant sur le bus.
• Integrity (I:H)             : High. Absence d'authentification mutuelle (injection possible).
• Availability (A:N)          : None. L'écoute passive ne dégrade pas le fonctionnement.
================================================================================
```

| Menace STRIDE | Niveau | Conséquence Opérationnelle dans un Cas Industriel |
| :--- | :---: | :--- |
| **Spoofing** (Usurpation) | **CRITIQUE** | Récupération de certificats de device ou clés d'API pour cloner un équipement légitime. |
| **Tampering** (Altération) | **ÉLEVÉ** | Injection active sur I²C pour altérer des seuils de capteurs ou les *Secure Boot Flags*. |
| **Repudiation** (Répudiation) | **MOYEN** | Impossibilité de tracer ou prouver l'intégrité d'une écriture mémoire locale non signée. |
| **Information Disclosure** | **CRITIQUE** | **Constaté sur banc.** Exfiltration passive et sans trace de clés de chiffrement de stockage. |
| **Denial of Service** | **ÉLEVÉ** | Forçage de la ligne SCL ou SDA à la masse (*Bus Clamping*), neutralisant le bus. |
| **Elevation of Privilege** | **CRITIQUE** | Contournement de licences logicielles ou altération des tables de privilèges en mémoire. |

---

## 2. Journaling de Réalisation : Le Lab Vlog sur 1 Week-end

*Comment ce banc d'essai a été conçu, assemblé et exploité de A à Z en laboratoire personnel au cours d'un week-end complet.*

```text
+-----------------------+     +-----------------------+     +-----------------------+     +-----------------------+
|  VENDREDI SOIR        | --> |  SAMEDI MATIN         | --> |  SAMEDI APRÈS-MIDI    | --> |  DIMANCHE             |
|  Prise en main ESP32  |     |  Datasheet EEPROM     |     |  Câblage I²C &        |     |  Sniffing PulseView   |
|  Simu Wokwi & LED     |     |  Brochage & Pièges    |     |  Validation 0x42      |     |  Exfiltration clé     |
+-----------------------+     +-----------------------+     +-----------------------+     +-----------------------+
```

---

### Étape 1 (Vendredi soir) : Première prise en main de l'ESP32-S3 & le "Blink"

C'est la toute première fois que j'utilise ce microcontrôleur : une carte **Espressif ESP32-S3-DevKitC-1** équipée d'un processeur Xtensa 32-bit dual-core à 240 MHz.

Pour démarrer proprement, j'installe l'extension **PlatformIO** sous VS Code et je crée un premier projet test : `esp32_s3_led_blink`.

#### La répétition générale sur simulateur (Wokwi)
Avant même de toucher à un fil ou de risquer d'endommager la carte, je fais un montage rapide sur l'outil de simulation en ligne **Wokwi** pour vérifier le câblage de principe et le comportement du code Arduino :

![Simulation Wokwi de l'ESP32-S3 avec LED](/images/projects/lab-analyse-protocoles-eeprom/wokwi-simulation-esp32-led.png)
*Test préliminaire du code sur Wokwi.com avec une LED sur le GPIO 4.*

Le code de test est volontairement minimaliste :

```cpp
#include <Arduino.h>

const int LED_PIN = 4;

void setup() {
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  digitalWrite(LED_PIN, HIGH);
  delay(1000);
  digitalWrite(LED_PIN, LOW);
  delay(1000);
}
```

#### Test des outils anciens (La règle d'or du lab)
Avant de connecter quoi que ce soit, une règle d'or pour éviter de perdre des heures sur des pannes fantômes : **tester les vieux outils**.

J'ai passé un coup de multimètre en mode bip sonore de continuité sur mes fils Dupont et sur les lignes de la breadboard. Résultat : deux fils femelles usés qui faisaient des faux contacts ont été mis à la poubelle avant d'attaquer !

#### Le montage réel sur table
Le code validé sur le simulateur et le matériel vérifié, je passe au montage réel sur la plaque d'essai avec une LED jaune et sa résistance de limitation :

![Montage réel de l'ESP32-S3 et LED sur breadboard](/images/projects/lab-analyse-protocoles-eeprom/montage-esp32-led-reel.jpg)
*Le montage réel : la LED clignote au rythme d'une seconde. L'environnement de dev est validé !*

---

### Étape 2 (Samedi matin) : Décryptage de l'EEPROM & Plongée dans la Datasheet

Passons maintenant au cœur de la cible : la mémoire non-volatile externe. C'est un petit circuit intégré à 8 broches récupéré dans mes tiroirs.

#### L'inspection à la loupe
En observant le marquage gravé au laser sur le dessus du boîtier :

![Boîtier PDIP-8 EEPROM 24LC256](/images/projects/lab-analyse-protocoles-eeprom/eeprom-24lc256.jpeg)
*Le marquage gravé au laser : Microchip 24LC256 - I/P YU8 - 2601.*

En décortiquant ce marquage :
- **Logo :** Microchip Technology.
- **24LC256 :** EEPROM série I²C d'une capacité de 256 Kbits (soit 32 Ko).
- **I / P :** Plage de température industrielle (`I` pour -40 °C à +85 °C) et type de boîtier traversant (`P` pour PDIP 8 broches).
- **YU8 / 2601 :** Traçabilité d'usine et date de fabrication (semaine 01 de l'année 2026).

Direction le site du fabricant pour récupérer la documentation technique (*Datasheet Microchip DS20001203*).

![Brochage de l'EEPROM 24LC256](/images/projects/lab-analyse-protocoles-eeprom/datasheet-schema-eeprom-24lc256.png)
*Brochage officiel de la mémoire 24LC256 en boîtier PDIP-8.*

#### Ce qu'il faut absolument retenir de la datasheet
1. **Les adresses matérielles (A0, A1, A2) :** En reliant ces 3 broches à la masse (GND), on fixe l'adresse I²C de la puce à `0x50` (sur 7 bits).
2. **La broche WP (Write Protect) :** Si on la relie à Vcc, la mémoire passe en lecture seule. Pour nos tests d'écriture, elle doit impérativement être connectée à GND.
3. **Le piège du temps d'écriture (tWR) :** Quand on écrit dans une case mémoire, l'EEPROM utilise un petit générateur interne haute tension pour piéger des électrons dans ses cellules physiques. Ce cycle prend **jusqu'à 5 ms**. Pendant ces 5 ms, la puce désactive son interface I²C et refuse de répondre ! Il faut donc impérativement laisser un petit `delay(6)` à `delay(10)` en code après chaque écriture.
4. **Les limites électriques (Absolute Maximum Ratings) :** Alimenter la puce en 3,3 V régulé depuis l'ESP32 pour respecter scrupuleusement les tolérances.

![Spécifications limites d'exploitation Microchip](/images/projects/lab-analyse-protocoles-eeprom/absolute-max-ratings.png)
*Les valeurs limites de tolérance pour éviter d'endommager la puce.*

---

### Étape 3 (Samedi après-midi) : Câblage & Première Discussion I²C

Une fois l'EEPROM comprise et les broches repérées, il est temps de passer au câblage de la liaison I²C sur plaque d'essai.

#### Le montage complet ESP32 ↔ EEPROM
Le bus I²C utilise deux lignes de communication fonctionnant en drain ouvert (*open-drain*) :
- **SDA (données) :** reliée au GPIO 4 de l'ESP32-S3.
- **SCL (horloge) :** reliée au GPIO 5 de l'ESP32-S3.

Pour que ces lignes reviennent au niveau haut (3,3 V) au repos, j'ajoute deux résistances de tirage (*pull-up*) de 4,7 kΩ.

![Câblage ESP32-S3 vers plaque d'essai](/images/projects/lab-analyse-protocoles-eeprom/montage-eeprom-eps32-s3.jpg)
*L'ESP32-S3 relié aux lignes de données (GPIO 4) et d'horloge (GPIO 5).*

![EEPROM 24LC256 sur breadboard avec résistances de pull-up](/images/projects/lab-analyse-protocoles-eeprom/montage-eeprom-eeprom.jpg)
*L'EEPROM 24LC256 installée avec ses résistances de rappel et ses broches d'adresse à la masse.*

#### Le premier script de validation
Pour s'assurer que la mémoire répond bien, j'écris un petit programme d'épreuve :
1. Il scanne le bus pour trouver l'adresse `0x50`.
2. Il écrit une valeur témoin `0x42` (le nombre 66 en décimal) à l'adresse mémoire `0x0010`.
3. Il relit cette même case mémoire pour vérifier que la valeur est identique.

```cpp
#include <Arduino.h>
#include <Wire.h>

#define I2C_SDA 4
#define I2C_SCL 5
#define EEPROM_ADDR 0x50 // A0=GND, A1=GND, A2=GND

bool writeEEPROM(uint8_t devAddr, uint16_t memAddr, uint8_t data) {
  Wire.beginTransmission(devAddr);
  Wire.write((uint8_t)(memAddr >> 8));   // Adresse haute (MSB)
  Wire.write((uint8_t)(memAddr & 0xFF)); // Adresse basse (LSB)
  Wire.write(data);
  byte status = Wire.endTransmission();
  delay(6); // Indispensable : cycle interne de 5 ms max
  return (status == 0);
}

uint8_t readEEPROM(uint8_t devAddr, uint16_t memAddr) {
  Wire.beginTransmission(devAddr);
  Wire.write((uint8_t)(memAddr >> 8));
  Wire.write((uint8_t)(memAddr & 0xFF));
  Wire.endTransmission();

  Wire.requestFrom(devAddr, (uint8_t)1);
  if (Wire.available()) {
    return Wire.read();
  }
  return 0xFF;
}

void setup() {
  Serial.begin(115200);
  delay(1500);
  Serial.println("\n[ESP32-S3] Test de la 24LC256");
  Wire.begin(I2C_SDA, I2C_SCL);

  // 1. Scan de présence
  Serial.print("[1/2] Scan de l'adresse 0x50... ");
  Wire.beginTransmission(EEPROM_ADDR);
  if (Wire.endTransmission() == 0) {
    Serial.println("OK (Puce détectée)");
  } else {
    Serial.println("ÉCHEC ! Vérifie le câblage.");
    return;
  }

  // 2. Écriture & Relecture témoin
  uint16_t testAddr = 0x0010;
  uint8_t payload = 0x42;
  Serial.printf("[2/2] Écriture de 0x%02X à l'adresse 0x%04X... ", payload, testAddr);
  writeEEPROM(EEPROM_ADDR, testAddr, payload);
  Serial.println("OK");

  uint8_t received = readEEPROM(EEPROM_ADDR, testAddr);
  Serial.printf("Valeur lue : 0x%02X\n", received);

  if (received == payload) {
    Serial.println("--> RÉSULTAT : L'EEPROM fonctionne parfaitement !");
  } else {
    Serial.println("--> RÉSULTAT : Donnée corrompue.");
  }
}

void loop() {}
```

**Verdict dans la console série :**
```text
[ESP32-S3] Test de la 24LC256
[1/2] Scan de l'adresse 0x50... OK (Puce détectée)
[2/2] Écriture de 0x42 à l'adresse 0x0010... OK
Valeur lue : 0x42
--> RÉSULTAT : L'EEPROM fonctionne parfaitement !
```
La mémoire est opérationnelle, on peut passer au scénario de sécurité !

---

### Étape 4 (Dimanche matin) : Le Scénario de la Clé Secrète

Pour simuler un équipement industriel réel (comme une passerelle IoT qui vérifie son jeton de session), je modifie le firmware :
- Au démarrage (`setup`), l'ESP32 écrit une clé d'authentification secrète (`"SECRET_KEY_1234"`) dans l'EEPROM.
- En boucle (`loop`), toutes les deux secondes, il vient relire cette clé sur le bus I²C.

```cpp
#include <Arduino.h>
#include <Wire.h>

#define I2C_SDA 4
#define I2C_SCL 5
#define EEPROM_ADDR 0x50

const uint16_t MEM_ADDR = 0x0010;
const char PAYLOAD[] = "SECRET_KEY_1234";

void writeEEPROM(uint16_t memAddress, const char* data) {
  Wire.beginTransmission(EEPROM_ADDR);
  Wire.write((uint8_t)(memAddress >> 8));
  Wire.write((uint8_t)(memAddress & 0xFF));
  for (int i = 0; data[i] != '\0'; i++) {
    Wire.write((uint8_t)data[i]);
  }
  Wire.endTransmission();
  delay(10);
}

void readEEPROM(uint16_t memAddress, uint8_t length) {
  Wire.beginTransmission(EEPROM_ADDR);
  Wire.write((uint8_t)(memAddress >> 8));
  Wire.write((uint8_t)(memAddress & 0xFF));
  Wire.endTransmission();

  Wire.requestFrom((uint8_t)EEPROM_ADDR, length);
  Serial.print("[Lecture I2C] : ");
  while (Wire.available()) {
    char c = Wire.read();
    Serial.print(c);
  }
  Serial.println();
}

void setup() {
  Serial.begin(115200);
  Wire.begin(I2C_SDA, I2C_SCL);
  Wire.setClock(100000); // 100 kHz standard
  delay(1000);
  Serial.println("\n--- Initialisation écriture EEPROM ---");
  writeEEPROM(MEM_ADDR, PAYLOAD);
  Serial.println("Écriture terminée.");
}

void loop() {
  readEEPROM(MEM_ADDR, strlen(PAYLOAD));
  delay(2000);
}
```

La clé secrète transite désormais toutes les 2 secondes sur deux petites pistes en cuivre du circuit imprimé...

---

### Étape 5 (Dimanche après-midi) : L'Arme du Crime — Sortie de l'Analyseur Logique

C'est ici que commence l'audit matériel. Pour intercepter les communications sans perturber le microcontrôleur, j'utilise un petit **analyseur logique USB 8 canaux / 24 MHz** (basé sur le contrôleur Cypress FX2LP, trouvable pour moins de 25 €).

Je connecte 3 sondes en dérivation directement sur les broches :
- **Canal 0** sur SDA
- **Canal 1** sur SCL
- **Masse** sur le rail GND commun

![Banc d'essai instrumenté avec analyseur logique](/images/projects/lab-analyse-protocoles-eeprom/montage-eeprom-analyseur-logique.jpg)
*Le banc d'essai complet : l'analyseur logique écoute passivement les lignes sans altérer le signal.*

#### Configuration de PulseView
Sous Linux, j'ouvre **PulseView** (l'interface graphique de la suite libre Sigrok).
1. Le périphérique est instantanément reconnu grâce au pilote open-source `fx2lafw`.

![Détection de l'analyseur sous PulseView](/images/projects/lab-analyse-protocoles-eeprom/pulseview-detection-analyseur-logique.png)
*Sélection du pilote libre fx2lafw dans PulseView.*

2. Je configure l'acquisition à **2 MHz** avec une mémoire tampon de **1 million d'échantillons (1 MSamples)**, ce qui nous donne une fenêtre de capture continue de 500 ms. Comme le bus I²C tourne à 100 kHz, échantillonner à 2 MHz offre un suréchantillonnage de 20×, parfait pour voir des fronts bien nets.

![Configuration des canaux dans PulseView](/images/projects/lab-analyse-protocoles-eeprom/pulseview-renomage-canaux.png)
*Renommage des canaux (SDA, SCL, GND) et paramétrage à 2 MHz / 1 MSamples.*

#### L'astuce du déclencheur (Trigger)
L'ESP32 met environ **1,5 seconde** à démarrer (chargement de la ROM de boot, initialisation des horloges). Si je lançais l'analyseur manuellement au pifomètre, le tampon de 500 ms se remplirait de vide avant même la première trame !

**La solution :** placer un **déclencheur matériel sur front descendant sur SDA**.  
Comme les lignes sont tirées au 3,3 V au repos, la toute première baisse de tension sur SDA avec l'horloge au repos marque la condition START de l'écriture initiale. L'analyseur attend patiemment et déclenche la capture pile au bon millième de seconde !

![Configuration du trigger matériel sur SDA](/images/projects/lab-analyse-protocoles-eeprom/pulseview-canal-sda-trigger-descendant.png)
*Réglage du trigger sur front descendant sur la ligne SDA.*

---

### Étape 6 (Dimanche fin d'après-midi) : L'Interception & le Décodage en Direct

Top départ : je redémarre l'ESP32. L'analyseur capture immédiatement la salve initiale d'écriture, puis la lecture cyclique !

![Vue globale du trafic I2C sous PulseView](/images/projects/lab-analyse-protocoles-eeprom/pulseview-sniff-eeprom.png)
*Les impulsions électriques capturées : l'écriture du secret à gauche, suivie de la lecture.*

À ce stade, nous n'avons que des signaux carrés bruts (des 0 et des 1). Pour les transformer en informations intelligibles, PulseView permet d'empiler des décodeurs protocolaires (*Stacked Decoders*) :

#### 1. Premier décodeur : Le protocole I²C
J'ajoute le décodeur **I²C** de base en lui indiquant que le canal 0 est SDA et le canal 1 est SCL.

![Sélection du décodeur I2C](/images/projects/lab-analyse-protocoles-eeprom/pulseview-trouver-i2c-decodeur.png)
*Ajout du décodeur de protocole I²C standard.*

Il assemble instantanément les signaux électriques en octets bruts et met en évidence les conditions START, STOP, et les accusés de réception ACK.

#### 2. Deuxième décodeur : La couche applicative 24xx EEPROM
Par-dessus le décodeur I²C, je clique sur **Stack Decoder** et j'empile le décodeur dédié aux mémoires **24xx EEPROM**.

![Empilement du décodeur 24xx EEPROM](/images/projects/lab-analyse-protocoles-eeprom/pulseview-24lcxx-decodeur.png)
*Empilement du décodeur 24xx au-dessus du flux I²C.*

Ce décodeur connaît la sémantique de notre mémoire : il sépare l'adresse 16 bits (`0x0010`), la commande d'écriture/lecture, et extrait directement la charge utile !

![Les canaux annotés dans PulseView](/images/projects/lab-analyse-protocoles-eeprom/pulseview-new-canal-24lc256.png)
*L'empilement des 5 lignes d'annotations au-dessus des signaux logiques bruts.*

#### 3. Le secret apparaît sous nos yeux !
En zoomant sur la ligne `I2C: Address/Data`, les octets transitant sur le bus apparaissent en clair sous forme de rectangles bleus :

![Exfiltration du secret sous PulseView](/images/projects/lab-analyse-protocoles-eeprom/pulseview-eeprom24xx-canal.png)
*La preuve en image : les octets du secret s'alignent parfaitement dans PulseView.*

Traduisons les octets hexadécimaux capturés :

| Octet Hex | `0x53` | `0x45` | `0x43` | `0x52` | `0x45` | `0x54` | `0x5F` | `0x4B` | `0x45` | `0x59` | `0x5F` | `0x31` | `0x32` | `0x33` | `0x34` |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Caractère ASCII** | **S** | **E** | **C** | **R** | **E** | **T** | **_** | **K** | **E** | **Y** | **_** | **1** | **2** | **3** | **4** |

```text
================================================================================
                       SECRET EXFILTRÉ AVEC SUCCÈS :
                           SECRET_KEY_1234
================================================================================
```

En quelques clics et avec un investissement matériel dérisoire, **100 % de la clé d'authentification a été dérobée**, sans laisser la moindre trace sur le système cible !

#### Le petit bonus : un glitch de bruit sur SDA
En poussant le zoom sur les fronts d'horloge, j'ai même pu observer un petit pic parasite (*glitch*) sur la ligne SDA :

![Glitch de bruit sur le canal SDA](/images/projects/lab-analyse-protocoles-eeprom/pulseview-bruit-glitch-sda.png)
*Zoom métrologique : un glitch de commutation visible sur la ligne de données.*

Heureusement, ce glitch survient lorsque l'horloge SCL est basse ; le protocole I²C ne lisant la valeur de SDA que lorsque SCL est à l'état haut, cette micro-perturbation a été ignorée par la puce et n'a pas corrompu la transmission.

---

### Étape 7 (Dimanche soir) : Le Bilan & les Contre-Mesures ("Zero Trust on PCB")

Ce week-end d'expérimentation démontre de manière très visuelle une réalité de la sécurité matérielle : **la sécurité par l'obscurité ou la confiance aveugle dans un boîtier fermé ne fonctionne pas.**

#### Comment sécuriser un vrai produit industriel ?
Si vous concevez une carte électronique destinée à être déployée sur le terrain, voici les bonnes pratiques de remédiation :

1. **Remplacer l'EEPROM par un Secure Element (Niveau Matériel) :**  
   Utiliser une puce dédiée comme le **Microchip ATECC608A/B** ou le **NXP EdgeLock SE050**. Le microcontrôleur envoie un défi (*challenge*), la puce calcule la signature en interne et renvoie uniquement la réponse. **La clé privée ne transite jamais sur les pistes de la carte.**
2. **Chiffrer la charge utile (Niveau Logiciel) :**  
   Si l'EEPROM standard est conservée pour des raisons de coût, le microcontrôleur doit impérativement chiffrer les données (ex: AES-256-GCM ou ChaCha20-Poly1305) avant de les émettre sur le bus, en stockant la clé racine dans les **eFuses** internes de l'ESP32 protégés par le *Secure Boot* et le *Flash Encryption*.
3. **Durcir le circuit imprimé (Règles de routage) :**  
   Faire circuler les pistes I²C dans des couches internes du PCB (*stripline*) entourées de plans de masse, supprimer tous les points de test de fabrication (*ICT test pads*) sur les cartes de série commerciale, ou appliquer une résine d'encapsulation opaque (*potting compound*).
4. **Verrouillage matériel d'écriture :**  
   Pour des configurations figées, relier en dur la broche WP (*Write Protect*) au potentiel Vcc pour empêcher toute injection malveillante.

---

## 3. Ressources & Documents de Référence

- 📑 **Rapport Scientifique Complet (23 pages) :** [Consulter / Télécharger le Whitepaper Officiel (PDF)](/docs/rapport-lab-analyse-i2c-eeprom.pdf)
- 💻 **Code source du banc d'essai :** Disponible sur mon [GitHub](https://github.com/piaw-cavarec)
- 📚 **Références normatives :** NXP UM10204 (I2C Bus Spec), Microchip DS20001203 (24LC256), Espressif ESP32-S3 TRM, FIRST CVSS v3.1.
