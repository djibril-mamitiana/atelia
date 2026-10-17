# ConcreteToolsPro — boutique B2B d'outils diamant

Site e-commerce réservé aux professionnels (catalogue, panier, commande par
virement bancaire, comptes clients, suivi de commande) avec back-office
d'administration, construit avec Next.js (App Router), TypeScript, Tailwind
CSS, Prisma ORM et PostgreSQL. L'application **et** la base de données sont
hébergées sur **[Railway](https://railway.com)**.

> Le dépôt s'appelle encore `atelia` (nom d'origine du projet).

> Identité visuelle et contenu originaux — l'expérience s'inspire des grands
> sites de bricolage/maison, sans reprendre la marque, le logo ou les textes
> d'aucun d'entre eux.

## Stack technique

| Domaine       | Choix                                                        |
| ------------- | ------------------------------------------------------------- |
| Framework     | Next.js 16 (App Router, Server Components, Server Actions)   |
| Langage       | TypeScript                                                    |
| Style         | Tailwind CSS v4                                               |
| Hébergement   | Railway (service Next.js + service PostgreSQL)                |
| Base de données | PostgreSQL sur Railway                                      |
| ORM           | Prisma 7 (client sans moteur Rust, adapter `pg`)              |
| Auth          | Session JWT maison (cookies httpOnly, `jose`, `bcryptjs`)      |
| Paiement      | Virement bancaire manuel (Stripe présent mais désactivé)      |
| Validation    | Zod, appliquée côté serveur sur toutes les mutations           |
| Langues       | FR / DE / EN / IT (`next-intl`, fichiers `messages/*.json`)    |

## 1. Installation

```bash
npm install
cp .env.example .env
```

## 2. Base de données — PostgreSQL sur Railway

La base de production est le service **PostgreSQL** du projet Railway.

### Travailler en local

Deux options :

- **Une base locale ou de test (recommandé pour développer)** : n'importe
  quel PostgreSQL. Par exemple, un second service PostgreSQL dans un
  environnement Railway de test, ou un Postgres installé sur la machine.
- **La base de production** : à éviter pour développer. Toute modification
  faite en local (commandes de test, `migrate dev`, seed) touche les vraies
  données.

Puis :

1. Récupérez l'URL de connexion : dans Railway, service **PostgreSQL →
   Variables → `DATABASE_PUBLIC_URL`**. C'est l'URL accessible depuis
   l'extérieur ; `DATABASE_URL` (host `*.railway.internal`) ne fonctionne
   qu'à l'intérieur de Railway.
2. Mettez-la dans `.env` sous `DATABASE_URL`. `DATABASE_URL_UNPOOLED` est
   inutile sur Railway (pas de pooler) : laissez-la vide ou supprimez-la.
3. Générez un secret de session et renseignez `NEXTAUTH_SECRET` :
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
4. Appliquez les migrations :
   ```bash
   npx prisma migrate deploy
   ```
5. **Base de test uniquement** : peuplez-la avec des données de démo
   (9 sous-catégories d'outils diamant, 1 marque "Diamond Pro", ~1417
   produits, 10 tutoriels, 20 utilisateurs, 50 commandes, 100 avis) :
   ```bash
   npx prisma db seed
   ```

### Connexion Prisma

Prisma 7 ne lit plus la chaîne de connexion depuis `schema.prisma` :

- la CLI (`migrate`, `db seed`, `studio`) passe par `prisma.config.ts`, qui
  utilise `DATABASE_URL_UNPOOLED` si elle est définie, sinon `DATABASE_URL` ;
- l'application se connecte via un driver adapter (`@prisma/adapter-pg`, voir
  [src/lib/db.ts](src/lib/db.ts)) sur `DATABASE_URL`.

> ⚠️ Si `DATABASE_URL_UNPOOLED` est encore définie quelque part (`.env`,
> variables Railway) avec une ancienne URL Neon, les migrations iraient sur
> Neon au lieu de Railway. Supprimez-la.

### Comptes de test créés par le seed

| Rôle     | Email                     | Mot de passe / code            |
| -------- | -------------------------- | ------------------------------ |
| Admin    | `christoftran@gmail.com`   | `Admin1234!`                   |
| Staff    | `staff@atelia.test`        | `Staff1234!`                   |
| Client   | un des emails générés      | code `DEMO-0001` … `DEMO-0018` |

Les emails clients générés sont visibles dans `/admin/customers` ou via
Prisma Studio (`npx prisma studio`). Les codes `DEMO-…` sont prévisibles :
ne lancez pas le seed sur la base de production.

### Vente réservée aux professionnels

- **Pas d'inscription publique** : `/inscription` invite seulement à nous
  contacter. Les comptes clients sont créés par l'équipe dans
  **/admin/customers → Nouveau client** (nom, entreprise, email, téléphone,
  code client généré ou saisi à la main).
- **Connexion client = email + code client** (insensible à la casse). Le
  personnel (`ADMIN`/`STAFF`) se connecte toujours avec son mot de passe,
  dans le même champ.
- **Hors connexion, aucun prix** : ils sont retirés côté serveur (voir
  [src/lib/auth/access.ts](src/lib/auth/access.ts)), donc absents aussi du
  code source de la page. Le filtre et le tri par prix sont désactivés, le
  panier, le checkout et les actions panier exigent un compte actif.
- **Désactiver un compte** (case « Compte actif ») coupe l'accès
  immédiatement, même si le client a encore une session ouverte. Un client
  ayant des commandes ne peut pas être supprimé, seulement désactivé.
- Les codes sont stockés en clair pour que l'équipe puisse les retransmettre
  au client. Si un code fuit, générez-en un nouveau depuis la fiche client.

### Contact et livraison (modifiables dans l'admin)

**/admin/settings → Contact et livraison** (rôle `ADMIN`) :

- **téléphone et email de contact**, affichés dans l'en-tête (« Une question ?
  Appelez-nous »), le pied de page, la page contact, les fiches produit et
  l'astuce matériaux. Le formulaire de contact est envoyé à cet email ;
- **tarifs de livraison standard et express**, appliqués à chaque commande.
  Il n'y a **pas de livraison gratuite** ni de retrait en magasin.

Tant que le formulaire n'a jamais été enregistré, les valeurs par défaut de
[src/lib/constants.ts](src/lib/constants.ts) s'appliquent
(`contact@concretetoolspro.com`, `01 23 45 67 89`, 5,90 € et 9,90 €).

## 3. Paiement — virement bancaire manuel

Le moyen de paiement actif est le **virement bancaire manuel** (pas de
prestataire tiers pour le moment) :

1. Renseignez vos coordonnées bancaires dans `.env` : `BANK_TRANSFER_HOLDER`,
   `BANK_TRANSFER_IBAN`, `BANK_TRANSFER_BIC`, `BANK_TRANSFER_BANK_NAME`.
2. Au checkout, le client valide sa commande (statut `PENDING`, paiement
   `PENDING`) et voit ensuite ces coordonnées ainsi que la référence à
   indiquer (le numéro de commande) sur `/commande/[id]`.
3. Dès réception du virement, un membre de l'équipe (rôle `ADMIN` ou
   `STAFF`) passe la commande en statut **Confirmée** depuis
   `/admin/orders/[id]` — le paiement est alors automatiquement marqué
   comme reçu.

Le prix final d'une commande est **toujours recalculé côté serveur**
(voir [src/server/services/pricing.ts](src/server/services/pricing.ts)) —
aucune valeur monétaire envoyée par le navigateur n'est utilisée pour
enregistrer la commande.

### Stripe (optionnel, désactivé)

Le nécessaire Stripe Checkout + webhooks reste dans le code
([src/lib/stripe.ts](src/lib/stripe.ts),
[src/app/api/webhooks/stripe/route.ts](src/app/api/webhooks/stripe/route.ts))
mais n'est plus appelé par le tunnel de commande actuel, qui crée
directement la commande avec un paiement `BANK_TRANSFER`. Pour repasser
sur Stripe : renseignez les clés dans `.env`, puis, dans
[src/server/actions/checkout.actions.ts](src/server/actions/checkout.actions.ts),
remplacez la création du `Payment` en `BANK_TRANSFER` par un appel à
`stripe.checkout.sessions.create(...)` (line items à partir de
`pricing.lines`, `success_url`/`cancel_url` vers `/commande/[id]` et
`/checkout`) et retournez son `url` pour rediriger le client.

## 4. Développement

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000). Le back-office est sur
`/admin` (rôle `ADMIN` ou `STAFF` requis).

## 5. Vérifications

```bash
npx tsc --noEmit     # TypeScript
npm run lint          # ESLint
npm run build         # build de production
npm test              # tests (voir /tests)
```

## 6. Déploiement (Railway)

Le projet Railway contient deux services : l'application Next.js, reliée à
ce dépôt GitHub, et PostgreSQL.

- **Chaque push sur `main` redéploie l'application** (service → *Settings
  → Source* : « Auto deploys when pushed to GitHub »). Railway lance
  `npm run build`, puis `npm start`.
- **Les migrations s'appliquent toutes seules.** Le service a une commande
  *pre-deploy*, `npm run db:deploy` (`prisma migrate deploy`), réglée dans
  *Settings → Deploy* de Railway. Elle n'est pas dans un fichier du dépôt :
  la config par fichier (`railway.json`) est dépréciée chez Railway. Elle
  s'exécute avant chaque mise en ligne. Si
  une migration échoue, le déploiement s'arrête et l'ancienne version reste
  en ligne. Il suffit donc de commiter le dossier `prisma/migrations/...`
  avec le code qui en a besoin.
- **Variables du service applicatif** (onglet *Variables*) :
  - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}` (référence au service
    PostgreSQL, réseau privé) ;
  - pas de `DATABASE_URL_UNPOOLED` (voir l'avertissement plus haut) ;
  - `NEXTAUTH_SECRET`, `NEXT_PUBLIC_APP_URL` (le domaine public du site) ;
  - `BANK_TRANSFER_*`, et si besoin `RESEND_API_KEY`, `EMAIL_FROM`,
    `SUPPORT_EMAIL`.
- **Vérifier un déploiement** : service applicatif → *Deployments* →
  logs. L'étape *Pre-deploy* doit afficher les migrations appliquées, ou
  « No pending migrations to apply ».
- **Ne lancez pas le seed sur la production.** Il crée des comptes de démo
  aux mots de passe et codes connus.

Aucune donnée persistante ne dépend du système de fichiers du serveur : tout
vit dans PostgreSQL. Les photos produit sont livrées avec le code
(`public/products/`).

## 7. Gérer les comptes

- **Clients professionnels** : depuis le back-office, **/admin/customers →
  Nouveau client** (voir « Vente réservée aux professionnels » plus haut).
- **Administrateur ou staff supplémentaire** : il n'y a pas encore d'écran
  pour ça. Promouvez un compte existant avec Prisma Studio, pointé sur la
  base voulue :
  ```bash
  npx prisma studio
  ```
  Puis, dans la table `User`, éditez la ligne et passez `role` à `ADMIN` ou
  `STAFF`. Le personnel se connecte avec un mot de passe, pas avec un code
  client.
- **Changer l'email ou le mot de passe de l'admin** : `scripts/set-admin-login.ts`
  lit `NEW_ADMIN_EMAIL` et `NEW_ADMIN_PASSWORD` dans l'environnement, pour que
  les identifiants ne passent jamais par le dépôt. Sans `--apply`, il affiche
  seulement ce qu'il ferait. S'il y a plusieurs admins, désignez le bon avec
  `ADMIN_CURRENT_EMAIL`. En production, la base n'étant joignable que depuis
  Railway : ajoutez les deux variables au service (`npx @railway/cli variable
  set … --service atelia --skip-deploys`), ajoutez
  `&& tsx scripts/set-admin-login.ts --apply` à `db:deploy` le temps d'un
  déploiement, puis supprimez les variables et retirez l'étape.

## Structure du projet

```
prisma/               schema.prisma, migrations, seed.ts
src/
  app/                 routes (App Router) : pages publiques, /admin, /api
  components/          composants UI (primitives + layout + domaine)
  server/
    actions/           Server Actions ("use server") — mutations
    queries/           lectures de données (Server Components)
    services/          logique métier pure (pricing, inventaire, panier…)
  lib/                 db (Prisma), auth, stripe, utils, constantes
  validations/         schémas Zod partagés client/serveur
  proxy.ts             protection des routes /admin et /compte
messages/              traductions FR / DE / EN / IT```

## Catalogue : catégories et données fournisseur

- **Sous-catégories** : une famille peut contenir des sous-catégories, par
  exemple « Disques Ø115 – Ø230 mm » → Disques / Disques silencieux / Disques
  pour matériaux abrasifs. Le menu additionne leurs produits et la page de la
  famille affiche aussi ceux des sous-catégories.
- **Disques Ø115–230** : [prisma/data/discs-115-230.json](prisma/data/discs-115-230.json)
  est le référentiel tiré du Katalog 2026 fournisseur (chapitre 1, p. 5-25) :
  diamètre, alésage, et type selon les icônes « Silent » et « Abrasiv ✓ ».
  [scripts/fix-discs-115-230.ts](scripts/fix-discs-115-230.ts) l'applique à la
  base (simulation par défaut, `--apply` pour écrire). Il a été appliqué en
  production le 11/10/2026 et le seed le rejoue.
- **Ajouter des produits du catalogue** : ajoutez-les à
  `diamond-pro-catalog.json` (en fin de fichier, pour garder les références
  `CTP-…` existantes), avec leur photo dans `product-photos.json`, puis
  [scripts/add-catalog-products.ts](scripts/add-catalog-products.ts)
  `<SKU…> [--apply]` les crée comme le seed. Exemple : les 7 TBO600-NZ,
  ajoutés le 11/10/2026.
- **Corriger des noms ou descriptions** : modifiez les lignes dans
  `diamond-pro-catalog.json` (champ `names` pour FR/EN/IT si le titre n'est
  pas dans `description-translations.json`), puis
  [scripts/sync-catalog-texts.ts](scripts/sync-catalog-texts.ts)
  `<SKU…> [--apply]` reporte en base les noms, les descriptions, les textes
  alternatifs des photos et les regroupements. Exemple : 31 noms provisoires
  remplacés par les vrais titres du catalogue le 11/10/2026.
- **Nettoyant béton** : [scripts/add-nettoyant-beton.ts](scripts/add-nettoyant-beton.ts)
  `[--apply]` a créé le 15/10/2026 la marque ABAX, la famille « Nettoyant
  béton » et les bidons Décap Béton 5 L / 20 L. Les bidons sont créés masqués
  à 0 €, faute de prix connu : saisissez prix et stock dans l'admin, puis
  rendez-les visibles. Un produit à 0 € ne peut pas être rendu visible. Le
  même script place les familles de carottage en tête (champ « Ordre » des
  catégories, que suivent l'accueil et les menus). Il ajoute aussi la vidéo
  de carottage aux deux familles de carottage et en fait un guide. Le seed
  le rejoue.
- **Ajouter des photos depuis l'admin** : dans la fiche produit (« Images »)
  et dans une catégorie (« Photos »), bouton « Ajouter des photos » ou
  glisser-déposer, depuis un ordinateur ou un téléphone. On peut ensuite les
  réordonner (la première est la photo principale) ou les retirer, puis il
  faut enregistrer la fiche. Les photos sont réduites dans le navigateur,
  puis converties en WebP (2000 px max.) par
  [src/server/services/media.ts](src/server/services/media.ts). Elles sont
  stockées dans la base (table `MediaFile`), pas sur le disque, que Railway
  efface à chaque déploiement. Elles sont servies à `/media/<id>.webp`, avec
  un cache permanent. Une photo retirée d'une fiche reste dans la table.
  On peut aussi coller l'adresse d'une photo (`https://…` ou un fichier de
  `public/`).
- **Photos d'une catégorie** : champ « Photos » dans Admin → Catégories.
  Elles s'affichent en galerie sur la page de la catégorie, avec
  agrandissement au clic. Une catégorie qui a des photos mais aucun produit
  invite à appeler. Elle apparaît quand même dans les menus et sur l'accueil,
  avec « N photos ».
- **Produits spéciaux** (case dans Admin → Catégories) : les photos et les
  produits visibles de ces catégories défilent dans la bande sous le haut de
  l'accueil. 10 éléments au plus par catégorie, en alternant les catégories.
  Toucher une photo ouvre sa catégorie sur cette photo
  (`/categories/<slug>?photo=N`), toucher un produit ouvre sa fiche. La bande
  est mise en pause au survol et ne défile pas si l'appareil demande moins
  d'animations.
- **Familles spéciales** :
  [scripts/add-special-categories.ts](scripts/add-special-categories.ts)
  `[--apply]` a créé le 17/10/2026 « Aide au carottage » (les 37 photos de
  l'atelier et la vidéo de carottage) et « Débouchage de tubes »
  (chasse-carottes hydrauliques et récupérateurs de carotte). Les photos et
  le texte de « Débouchage de tubes », en 4 langues, viennent des PDF
  fournisseur `H250067_Betonkerntreiber_2/3/4`. Les PDF eux-mêmes ne sont pas
  publiés : ils montrent le fournisseur, ses coordonnées et les prix d'achat.
  Le script a aussi coché « Produits spéciaux » pour ces deux catégories et
  « Nettoyant béton ». « Aide au carottage » remplace les sous-catégories
  « Accessoires carottage / sciage » de la veille, et leurs anciennes
  adresses redirigent vers elle. Le seed rejoue le script.
- **Base de production** : elle n'est accessible que depuis Railway (pas de
  proxy public). Pour un script ponctuel, l'ajouter temporairement à
  `db:deploy` (simulation, puis `--apply`), puis le retirer. Sinon il
  réécrirait à chaque déploiement les modifications faites dans l'admin.

## Vidéos

Une vidéo est un simple lien, collé dans l'admin : un lien YouTube (bouton
« Partager », Shorts compris) ou l'adresse d'un fichier `.mp4`. Les liens
YouTube sont lus dans le lecteur YouTube (sans cookie avant lecture), les
Shorts en format vertical. On peut en mettre à trois endroits :

- **Produit** (champ « Vidéos », une par ligne, `lien | titre` en option) :
  dans la galerie de la fiche, après les photos.
- **Catégorie** (champ « Vidéo ») : en haut de la page de la catégorie. La
  vidéo de la famille « Nettoyant béton » est aussi celle qui se lance depuis
  les bidons en haut de l'accueil.
- **Guide** (Tutoriels → « Vidéo ») : la miniature YouTube est reprise
  automatiquement si le champ « Miniature » est vide.

## Limitations connues / pistes d'amélioration

- **Emails transactionnels** (confirmation de commande, réinitialisation de
  mot de passe) : le mécanisme (tokens, expiration) est implémenté mais
  aucun fournisseur d'envoi n'est branché — ajoutez une clé API (Resend,
  Postmark…) dans `src/lib/email.ts` pour une livraison réelle.
- **Rate limiting** (dont les tentatives de connexion) : limiteur en mémoire
  par instance, suffisant tant que le service Railway tourne sur une seule
  réplique. Passez à Redis (Railway en propose un) si vous en ajoutez.
- **Photos produit** : 113 produits ont une vraie photo fournisseur
  (`public/products/`, correspondance SKU → photo dans
  `prisma/data/product-photos.json`). Les produits sans photo sont
  désactivés, donc masqués de la boutique, en attendant d'être
  photographiés. Leurs photos s'ajoutent maintenant depuis l'admin (voir
  « Ajouter des photos depuis l'admin »).
