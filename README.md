# Atelia — plateforme e-commerce premium

Site e-commerce complet (catalogue, panier, checkout, paiement Stripe, comptes
clients, suivi de commande) avec back-office d'administration, construit avec
Next.js (App Router), TypeScript, Tailwind CSS, Prisma ORM et PostgreSQL
hébergé sur **Neon**.

> Identité visuelle et contenu originaux — l'expérience s'inspire des grands
> sites de bricolage/maison, sans reprendre la marque, le logo ou les textes
> d'aucun d'entre eux.

## Stack technique

| Domaine       | Choix                                                        |
| ------------- | ------------------------------------------------------------- |
| Framework     | Next.js 16 (App Router, Server Components, Server Actions)   |
| Langage       | TypeScript                                                    |
| Style         | Tailwind CSS v4                                               |
| Base de données | PostgreSQL sur [Neon](https://neon.tech)                    |
| ORM           | Prisma 7 (client sans moteur Rust, adapter `pg`)              |
| Auth          | Session JWT maison (cookies httpOnly, `jose`, `bcryptjs`)      |
| Paiement      | Stripe Checkout + webhooks                                    |
| Validation    | Zod, appliquée côté serveur sur toutes les mutations           |

## 1. Installation

```bash
npm install
cp .env.example .env
```

## 2. Base de données — Neon PostgreSQL

1. Créez un compte sur [neon.tech](https://neon.tech) puis un nouveau projet.
2. Dans **Dashboard → Connection string**, récupérez :
   - la chaîne **pooled** (avec `-pooler` dans le host) → `DATABASE_URL`
   - la chaîne **directe** (sans pooler) → `DATABASE_URL_UNPOOLED`
   - si Neon ne vous en donne qu'une, utilisez-la pour les deux variables.
3. Renseignez-les dans `.env`.
4. Générez un secret de session et renseignez `NEXTAUTH_SECRET` :
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
5. Appliquez le schéma et les migrations :
   ```bash
   npx prisma migrate dev --name init
   ```
6. Peuplez la base avec des données réalistes (22 catégories, 10 marques,
   50 produits, 10 tutoriels, 20 utilisateurs, 50 commandes, 100 avis) :
   ```bash
   npx prisma db seed
   ```

### Pourquoi deux URLs Neon ?

Prisma 7 ne lit plus la chaîne de connexion depuis `schema.prisma` : la CLI
(`migrate`, `db seed`, `studio`) utilise `prisma.config.ts`
(→ `DATABASE_URL_UNPOOLED`, une connexion directe — nécessaire pour les DDL
et la base fantôme des migrations), tandis que l'application au runtime se
connecte via un driver adapter (`@prisma/adapter-pg`, voir
[src/lib/db.ts](src/lib/db.ts)) sur `DATABASE_URL` (la connexion **pooled**,
adaptée aux fonctions serverless de Vercel).

### Comptes de test créés par le seed

| Rôle     | Email                     | Mot de passe   |
| -------- | -------------------------- | -------------- |
| Admin    | `christoftran@gmail.com`   | `Admin1234!`   |
| Staff    | `staff@atelia.test`        | `Staff1234!`   |
| Client   | un des emails générés      | `Client1234!`  |

Les emails clients générés sont visibles dans la sortie de `prisma db seed`
ou via Prisma Studio (`npx prisma studio`).

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

## 6. Déploiement (Vercel)

1. Poussez le repo sur GitHub et importez-le sur [Vercel](https://vercel.com/new).
2. Renseignez les mêmes variables d'environnement que `.env` dans les
   *Environment Variables* du projet Vercel (utilisez vos clés Stripe live
   et votre URL Neon de production — vous pouvez créer une branche Neon
   dédiée à la prod).
3. Après le premier déploiement, exécutez la migration + le seed (une seule
   fois pour la prod, sans le seed si vous ne voulez pas de données de démo) :
   ```bash
   DATABASE_URL_UNPOOLED="..." npx prisma migrate deploy
   ```
4. Configurez le webhook Stripe de production vers
   `https://votre-domaine.vercel.app/api/webhooks/stripe`.

Aucune donnée persistante ne dépend du système de fichiers local — tout vit
dans Neon (données) et Stripe (paiements), ce qui est compatible avec les
fonctions serverless de Vercel.

## 7. Créer un compte administrateur supplémentaire

Le seed crée déjà un compte `ADMIN`. Pour en promouvoir un autre :

```bash
npx prisma studio
# Table User → éditer la ligne → role = ADMIN
```

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
```

## Limitations connues / pistes d'amélioration

- **Emails transactionnels** (confirmation de commande, réinitialisation de
  mot de passe) : le mécanisme (tokens, expiration) est implémenté mais
  aucun fournisseur d'envoi n'est branché — ajoutez une clé API (Resend,
  Postmark…) dans `src/lib/email.ts` pour une livraison réelle.
- **Rate limiting** : limiteur en mémoire par instance (suffisant pour un
  déploiement à faible échelle) — passez à Upstash/Redis si vous scalez à
  plusieurs instances.
- **Images du seed** : placeholders `picsum.photos`, à remplacer par vos
  propres photos produit avant mise en production.
