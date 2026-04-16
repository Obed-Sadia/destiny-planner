// DestinyPlanner — Templates business (v2.0)
// Données pré-remplies pour les 7 étapes du wizard entrepreneur.
// Prompts orientés startup/business — l'utilisateur peut tout modifier.

import type {
  Step1Data, Step2Data, Step3Data, Step4Data,
  Step5Data, Step6Data, Step7Data,
} from '../types'

// ─── Type ────────────────────────────────────────────────────

export interface BusinessTemplate {
  id: string
  name: string
  icon: string
  tagline: string
  description: string
  steps: {
    1: Step1Data
    2: Step2Data
    3: Step3Data
    4: Step4Data
    5: Step5Data
    6: Step6Data
    7: Step7Data
  }
}

// ─── Template 1 : Lancement de produit/service ───────────────

const PRODUCT_LAUNCH: BusinessTemplate = {
  id: 'product-launch',
  name: 'Lancement de produit/service',
  icon: '🚀',
  tagline: 'MVP · SaaS · App · B2B / B2C',
  description: 'Structurez le lancement d\'un MVP, d\'une app ou d\'un service avec les questions clés du go-to-market.',

  steps: {
    1: {
      title: 'Lancement [Nom de votre produit]',
      description:
        'Nous développons [solution] pour résoudre [problème précis] pour [cible]. ' +
        'Notre différenciation : [USP — en quoi sommes-nous meilleurs que les alternatives]. ' +
        'Modèle économique : [SaaS / marketplace / service / freemium]. ' +
        'Segment d\'attaque prioritaire : [niche précise].',
      success_image:
        'Notre produit est utilisé activement par [X] clients payants, génère [MRR cible] de revenus ' +
        'récurrents, et notre NPS mesure que nous résolvons réellement le problème.',
    },

    2: {
      reflection:
        'Ai-je validé ce problème avec au moins 10 conversations clients (discovery calls) ? ' +
        'Existe-t-il des solutions concurrentes, et pourquoi les utilisateurs paieraient-ils pour la mienne ? ' +
        'Quelle expérience ou donnée me donne une conviction fondée — pas juste une intuition ?',
      conviction_or_impulse: 'conviction',
    },

    3: {
      strengths:
        'Expertise technique ou sectorielle unique. Réseau de prospects pré-identifiés. ' +
        'Avantage compétitif défendable (IP, donnée propriétaire, coût, expérience utilisateur). ' +
        'Capacité à itérer rapidement en mode lean.',
      weaknesses:
        'Notoriété nulle au démarrage. Ressources limitées (capital, équipe). ' +
        'Cycle de vente potentiellement long en B2B. ' +
        'Risque de sur-ingénierie avant validation du marché.',
      opportunities:
        'Marché en croissance ou en disruption. Problème non bien résolu par les acteurs existants. ' +
        'Possibilité de partenariats OEM ou distribution. ' +
        'Accès à des programmes d\'accélération ou de financement (BPI, VC seed).',
      threats:
        'Concurrents bien financés qui pourraient pivoter vers votre marché. ' +
        'CAC (coût d\'acquisition client) trop élevé face au LTV. ' +
        'Dépendance à une plateforme tierce (App Store, marketplace). ' +
        'Changements réglementaires (RGPD, IA Act, sectoriels).',
    },

    4: {
      financial_cost:
        'Budget MVP (dev, design, infra) : [X k€]. ' +
        'Budget marketing & acquisition (3 mois) : [X k€]. ' +
        'Burn rate mensuel estimé : [X k€/mois]. ' +
        'Runway cible avant breakeven ou nouvelle levée : 18 mois.',
      time_cost:
        '3 mois pour un MVP testable. 6-9 mois pour atteindre les premières ventes récurrentes. ' +
        '12-18 mois pour valider le product-market fit.',
      energy_cost:
        'Disponibilité quasi-totale les 6 premiers mois : produit + ventes + support simultanés. ' +
        'Capacité à gérer les rejets, le silence des prospects et les pivots fréquents.',
      relationship_impact:
        'Sollicitation du réseau personnel pour bêta-testeurs, introductions commerciales et early adopters. ' +
        'Partage du risque si co-fondateurs impliqués.',
      sacrifices:
        'Revenus réduits ou nuls pendant la phase pre-revenue. ' +
        'Vie personnelle impactée en phase de lancement (soirées, week-ends). ' +
        'Sécurité d\'un poste salarié abandonnée.',
      ready_to_pay: false,
    },

    5: {
      budget_detail:
        'Développement MVP : [X k€]. ' +
        'Infrastructure cloud (12 mois) : [X k€]. ' +
        'Marketing & acquisition (SEA, contenu, outbound) : [X k€]. ' +
        'Légal (CGU, CGV, mentions légales, RGPD) : [X k€]. ' +
        'Buffer imprévus (20%) : [X k€].',
      duration_estimate:
        'M1-M3 : MVP → M4-M5 : bêta privée (10-50 utilisateurs) → M6 : lancement public → ' +
        'M7-M12 : itérations + acquisition → M13+ : scalabilité.',
      milestones_draft: [
        { title: 'MVP fonctionnel et testable en interne', due_date: '' },
        { title: '10 bêta-testeurs actifs — retours structurés collectés', due_date: '' },
        { title: 'Première version payante déployée en production', due_date: '' },
        { title: '100 utilisateurs actifs (DAU/MAU)', due_date: '' },
        { title: 'MRR de [X k€] atteint', due_date: '' },
        { title: 'Product-market fit validé (rétention M3 > 40%)', due_date: '' },
      ],
    },

    6: {
      resources_available:
        'Compétences techniques internes. Réseau de 10-20 prospects pré-identifiés. ' +
        'Outils SaaS no-code/low-code (Stripe, Supabase, Vercel). ' +
        'Accès potentiel à un accélérateur, incubateur ou programme Google/AWS Startup.',
      resources_missing:
        'Capital de démarrage (amorçage). Développeur ou designer complémentaire. ' +
        'Expert growth/marketing. Accès direct au canal de distribution cible.',
      decision: 'go',
      negotiation_plan:
        'Bootstrapping + premiers revenus en pré-vente (LOI/lettre d\'intention). ' +
        'Ou : levée seed [X k€] via business angels. ' +
        'Ou : revenue-based financing dès les premières ventes récurrentes.',
    },

    7: {
      success_criteria:
        'Le produit est en production stable, utilisé quotidiennement par des clients payants, ' +
        'génère des revenus récurrents croissants, et le churn mensuel est inférieur à [X%].',
      kpi_1: 'MRR (Monthly Recurring Revenue) : [X k€] à M+12',
      kpi_2: 'NPS (Net Promoter Score) ≥ 40 mesuré en bêta et maintenu',
      kpi_3: 'CAC (Coût d\'Acquisition Client) < LTV × 1/3',
      commitment_statement:
        'Je m\'engage à parler à mes clients chaque semaine, à ne pas coder de fonctionnalité ' +
        'non validée par la donnée, et à itérer rapidement sur la base des métriques réelles — ' +
        'pas de mes intuitions.',
      start_date: '',
    },
  },
}

// ─── Template 2 : Création d'entreprise ──────────────────────

const COMPANY_CREATION: BusinessTemplate = {
  id: 'company-creation',
  name: "Création d'entreprise",
  icon: '🏢',
  tagline: 'SAS · SARL · Freelance structuré · Holding',
  description: 'De l\'immatriculation à la première facturation : structurez votre projet de création avec rigueur.',

  steps: {
    1: {
      title: "Création de [Nom de l'entreprise]",
      description:
        'Nous créons une [SAS / SARL / SCI / EURL / autre] spécialisée dans [domaine / offre]. ' +
        'Proposition de valeur : [ce que nous faisons mieux ou différemment]. ' +
        'Marché adressable estimé : [TAM / SAM / SOM]. ' +
        'Clients cibles prioritaires : [profil ICP précis].',
      success_image:
        'Notre entreprise est immatriculée, juridiquement et fiscalement saine, ' +
        'génère ses premières factures récurrentes et dispose d\'une équipe ou d\'un réseau de partenaires engagés.',
    },

    2: {
      reflection:
        'Pourquoi maintenant — et pas dans 6 mois ? ' +
        'Quelle compétence, donnée ou position unique me donne un avantage sur ce marché spécifique ? ' +
        'Suis-je prêt à assumer la responsabilité d\'une structure juridique, de charges sociales ' +
        'et d\'une éventuelle équipe — même en période de vaches maigres ?',
      conviction_or_impulse: 'conviction',
    },

    3: {
      strengths:
        'Expertise sectorielle des fondateurs difficile à répliquer. ' +
        'Réseau clients ou partenaires stratégiques existant. ' +
        'Structure légère avec faible point mort. ' +
        'Capacité à offrir une offre sur-mesure que les grandes structures ne peuvent pas adresser.',
      weaknesses:
        'Notoriété nulle — tout le pipeline commercial est à construire. ' +
        'Trésorerie et financement limités au démarrage. ' +
        'Processus internes inexistants (RH, facturation, reporting). ' +
        'Sur-dépendance aux fondateurs à court terme.',
      opportunities:
        'Gap de marché clairement identifié et non adressé. ' +
        'Transformation digitale forçant la réorganisation du secteur. ' +
        'Dispositifs d\'aide à la création (ACRE, BPI, France 2030, aides régionales). ' +
        'Partenariats de distribution ou revendeurs potentiels.',
      threats:
        'Acteurs établis avec plus de ressources commerciales et marketing. ' +
        'Cycles de vente longs en B2B avec paiement à 60-90 jours. ' +
        'Difficulté à recruter des profils clés en phase de démarrage. ' +
        'Risque de sur-personnalisation des premières offres (piège du sur-mesure non scalable).',
    },

    4: {
      financial_cost:
        'Capital social : [X k€]. ' +
        'Frais de création (avocat, expert-comptable, greffe) : [X k€]. ' +
        'Runway minimal avant premier revenu : [X mois] × [burn rate mensuel]. ' +
        'Fonds de roulement initial (BFR) : [X k€]. ' +
        'Assurances professionnelles (RC Pro, etc.) : [X €/an].',
      time_cost:
        'Création juridique : 1-2 mois. ' +
        'Premiers contrats signés : 3-6 mois. ' +
        'Breakeven opérationnel : 12-24 mois selon le modèle et le secteur.',
      energy_cost:
        'Phase de démarrage : gestion simultanée du juridique, commercial, opérationnel et administratif. ' +
        'Disponibilité de 60-70h/semaine en phase critique. ' +
        'Capacité à porter seul plusieurs casquettes avant les premiers recrutements.',
      relationship_impact:
        'Réseau professionnel mobilisé pour les premières missions, recommandations et introductions. ' +
        'Impact financier et organisationnel sur la vie personnelle (revenus, sécurité, disponibilité).',
      sacrifices:
        'Abandon d\'un poste salarié et de ses avantages (sécurité, retraite, mutuelle, congés). ' +
        'Revenus inexistants ou très réduits pendant la phase pré-revenue. ' +
        'Engagement personnel (caution, garanties) potentiellement requis.',
      ready_to_pay: false,
    },

    5: {
      budget_detail:
        'Frais juridiques & comptabilité (an 1) : [X k€]. ' +
        'Outils & infrastructure (CRM, facturation, cloud) : [X k€/mois]. ' +
        'Commercial & marketing (site, contenu, événements) : [X k€]. ' +
        'Trésorerie de sécurité : minimum 3 mois de charges fixes. ' +
        'Recrutement (si applicable en an 1) : [X k€].',
      duration_estimate:
        'M1-M2 : création juridique et administrative → ' +
        'M3-M6 : premiers contrats et clients → ' +
        'M6-M12 : structuration (équipe, process, offre) → ' +
        'M12-M24 : scalabilité et recrutements stratégiques.',
      milestones_draft: [
        { title: 'Statuts déposés, SIRET obtenu, compte bancaire ouvert', due_date: '' },
        { title: 'Premier contrat signé et première facture émise', due_date: '' },
        { title: 'Recrutement du premier salarié ou freelance clé', due_date: '' },
        { title: 'Breakeven opérationnel atteint', due_date: '' },
        { title: 'Clôture du premier exercice comptable positif', due_date: '' },
      ],
    },

    6: {
      resources_available:
        'Compétences et expérience des fondateurs. ' +
        'Réseau de clients potentiels ou prescripteurs identifiés. ' +
        'Accès à des dispositifs d\'aide (ACRE, BPI Création, aides régionales, prêt d\'honneur Réseau Entreprendre). ' +
        'Outils cloud modernes à faible coût (G Suite, Notion, Pennylane).',
      resources_missing:
        'Expert-comptable et avocat d\'affaires de confiance. ' +
        'Associé ou collaborateur complémentaire (profil commercial si fondateur technique, ou inversement). ' +
        'Ligne de crédit bancaire ou apport en capital complémentaire.',
      decision: 'go',
      negotiation_plan:
        'Apport personnel + prêt bancaire garanti BPI (Prêt Création Entreprise). ' +
        'Levée love money si besoin. ' +
        'Recherche d\'un associé complémentaire pour partager le risque opérationnel et financier.',
    },

    7: {
      success_criteria:
        'L\'entreprise est immatriculée, juridiquement et fiscalement saine, ' +
        'dispose d\'au moins 3 clients actifs récurrents, ' +
        'génère un chiffre d\'affaires couvrant ses charges et commence à dégager de la trésorerie.',
      kpi_1: 'Chiffre d\'affaires annuel an 1 : [X k€] (objectif de breakeven)',
      kpi_2: 'Taux de marge brute ≥ [X%] maintenu dès le 2ème exercice',
      kpi_3: '[X] clients actifs récurrents à M+18',
      commitment_statement:
        'Je m\'engage à structurer l\'entreprise sur des bases solides (juridique, comptabilité, social) ' +
        'dès le premier jour, à signer les premiers contrats avant de recruter, ' +
        'et à maintenir une gestion de trésorerie prévisionnelle rigoureuse chaque mois.',
      start_date: '',
    },
  },
}

// ─── Template 3 : Investissement immobilier ──────────────────

const REAL_ESTATE: BusinessTemplate = {
  id: 'real-estate',
  name: 'Investissement immobilier',
  icon: '🏠',
  tagline: 'Locatif · LMNP · SCI · Immeuble de rapport',
  description: 'Structurez votre projet d\'acquisition ou de développement immobilier : financement, rendement, gestion locative.',

  steps: {
    1: {
      title: 'Acquisition [Adresse / Type de bien]',
      description:
        'Nous acquérons un [appartement / immeuble / local commercial / terrain] situé à [ville / quartier], ' +
        'd\'une surface de [X m²], dans l\'objectif de [location nue / LMNP / colocation / immeuble de rapport]. ' +
        'Structure juridique : [SCI / LMNP / détention en nom propre]. ' +
        'Stratégie de rendement : [cashflow positif / plus-value à la revente / les deux].',
      success_image:
        'Le bien est acquis, loué à 100% et génère un cashflow net positif de [X €/mois] après toutes charges. ' +
        'Le rendement locatif brut atteint [X%] et la valeur du patrimoine progresse conformément aux projections.',
    },

    2: {
      reflection:
        'Ai-je réellement calculé le rendement net-net (charges, taxe foncière, gestion, vacance locative, travaux) ' +
        'et pas seulement le rendement brut affiché ? ' +
        'Ce bien correspond-il à une stratégie patrimoniale définie ou à une opportunité émotionnelle ? ' +
        'Ai-je les reins financiers suffisants (apport, épargne de sécurité, capacité d\'emprunt) pour assumer les imprévus ?',
      conviction_or_impulse: 'conviction',
    },

    3: {
      strengths:
        'Actif tangible et déflationnaire sur le long terme. ' +
        'Effet de levier bancaire — investissement amplifié par le crédit. ' +
        'Revenus locatifs récurrents et prévisibles. ' +
        'Avantages fiscaux selon le régime (LMNP, déficit foncier, SCI à l\'IS).',
      weaknesses:
        'Liquidité faible — sortie non immédiate en cas de besoin de trésorerie. ' +
        'Vacance locative ou impayés pouvant impacter le cashflow. ' +
        'Coûts cachés sous-estimés : notaire, travaux, gestion, copropriété, assurances. ' +
        'Dépendance au marché local et à la réglementation locative.',
      opportunities:
        'Décote sur un bien à rénover générant une plus-value immédiate à la création de valeur. ' +
        'Marché locatif tendu dans la zone cible — vacance quasi nulle. ' +
        'Contexte de taux favorable ou en baisse (arbitrage coût du crédit / rendement). ' +
        'Possibilité de division, surélévation ou changement d\'usage pour augmenter la valeur.',
      threats:
        'Hausse des taux d\'intérêt réduisant la capacité d\'emprunt et la rentabilité. ' +
        'Évolution de la réglementation (DPE, encadrement des loyers, loi ALUR). ' +
        'Dégradation du bien ou litige locataire long et coûteux. ' +
        'Retournement du marché local entraînant une moins-value latente.',
    },

    4: {
      financial_cost:
        'Prix d\'achat : [X k€]. ' +
        'Frais de notaire (7-8% dans l\'ancien, 2-3% dans le neuf) : [X k€]. ' +
        'Travaux de rénovation estimés : [X k€]. ' +
        'Apport personnel requis (10-20% + frais) : [X k€]. ' +
        'Mensualité crédit estimée : [X €/mois] sur [X ans].',
      time_cost:
        'Recherche et visites : 1-3 mois. ' +
        'Compromis → acte définitif : 3 mois. ' +
        'Travaux et mise en location : 1-4 mois selon ampleur. ' +
        'Gestion courante : 2-4h/mois en gestion directe, quasi nulle en gestion déléguée.',
      energy_cost:
        'Phase de recherche intensive : visites, comparaison, due diligence chiffrée. ' +
        'Coordination des travaux si rénovation. ' +
        'Gestion locative (sélection locataires, état des lieux, déclaration fiscale) ou délégation à une agence.',
      relationship_impact:
        'Impact sur la capacité d\'emprunt globale du foyer. ' +
        'Exposition du co-emprunteur ou garant. ' +
        'Si SCI avec associés : gouvernance à formaliser dans les statuts.',
      sacrifices:
        'Immobilisation d\'un apport significatif. ' +
        'Réduction de la capacité d\'emprunt pour d\'autres projets (résidence principale). ' +
        'Engagement sur 15-25 ans avec sortie complexe.',
      ready_to_pay: false,
    },

    5: {
      budget_detail:
        'Acquisition nette : [X k€]. ' +
        'Frais de notaire : [X k€]. ' +
        'Travaux (devis validés) : [X k€]. ' +
        'Ameublement si LMNP : [X k€]. ' +
        'Fonds de réserve imprévus (10% du budget total) : [X k€]. ' +
        'Financement : crédit [X k€] à [X%] sur [X ans] + apport [X k€].',
      duration_estimate:
        'M1-M3 : recherche, offre, compromis → ' +
        'M4-M6 : acte définitif, travaux → ' +
        'M7 : première mise en location → ' +
        'M12+ : optimisation fiscale et second investissement.',
      milestones_draft: [
        { title: 'Simulation financière validée (rendement net ≥ seuil cible)', due_date: '' },
        { title: 'Offre d\'achat acceptée par le vendeur', due_date: '' },
        { title: 'Compromis de vente signé et financement accordé', due_date: '' },
        { title: 'Acte authentique signé chez le notaire', due_date: '' },
        { title: 'Travaux terminés et bien aux normes DPE', due_date: '' },
        { title: 'Premier locataire en place, premier loyer encaissé', due_date: '' },
      ],
    },

    6: {
      resources_available:
        'Apport personnel disponible. ' +
        'Capacité d\'emprunt validée par la banque. ' +
        'Réseau (agents immobiliers, notaires, artisans) identifié. ' +
        'Expertise fiscale (expert-comptable ou conseiller patrimonial) accessible.',
      resources_missing:
        'Artisans de confiance pour devis et travaux fiables. ' +
        'Gestionnaire locatif si gestion déléguée. ' +
        'Conseil juridique pour optimisation structure (SCI, LMNP vs nu).',
      decision: 'go',
      negotiation_plan:
        'Négociation du prix d\'achat sur base des travaux à réaliser et comparables de marché. ' +
        'Optimisation du financement : taux, durée, différé de remboursement pendant travaux. ' +
        'Choix du régime fiscal optimal avant signature.',
    },

    7: {
      success_criteria:
        'Le bien est loué, génère un cashflow net positif après toutes charges et mensualité crédit, ' +
        'le rendement net atteint l\'objectif fixé, et la gestion courante est organisée (directe ou déléguée).',
      kpi_1: 'Rendement locatif brut : [X%] — net-net : [X%]',
      kpi_2: 'Cashflow mensuel net (après crédit, charges, fiscalité) : [+ X €]',
      kpi_3: 'Taux d\'occupation : ≥ 95% sur les 12 premiers mois',
      commitment_statement:
        'Je m\'engage à ne pas acquérir ce bien sans simulation financière complète validée, ' +
        'à maintenir une épargne de sécurité de 6 mois de charges, ' +
        'et à revoir la stratégie fiscale à chaque exercice.',
      start_date: '',
    },
  },
}

// ─── Template 4 : Partenariat / Joint-venture ─────────────────

const PARTNERSHIP: BusinessTemplate = {
  id: 'partnership',
  name: 'Partenariat / Joint-venture',
  icon: '🤝',
  tagline: 'Alliance stratégique · Co-entreprise · Distribution partenaire',
  description: 'Structurez une alliance business : objectifs partagés, gouvernance, partage de valeur et sortie.',

  steps: {
    1: {
      title: 'Partenariat [Votre entreprise] × [Partenaire]',
      description:
        'Nous structurons un partenariat stratégique entre [Votre entité] et [Partenaire] ' +
        'dans le cadre de [objet du partenariat : co-développement / distribution / R&D / commercialisation]. ' +
        'Durée envisagée : [X ans]. Structure juridique : [accord commercial / JV dédiée / GIE / autre]. ' +
        'Territoire et périmètre : [géographie, produits/services concernés, droits d\'exclusivité].',
      success_image:
        'Le partenariat génère [X k€ de CA commun / X nouveaux clients / X marchés ouverts], ' +
        'les deux parties bénéficient d\'un retour sur investissement mesurable, ' +
        'et la gouvernance fonctionne sans friction opérationnelle.',
    },

    2: {
      reflection:
        'Pourquoi ce partenaire spécifiquement — et quel actif ou accès unique apporte-t-il que je ne peux pas développer seul ? ' +
        'Nos intérêts sont-ils réellement alignés à 3 ans, ou juste à court terme ? ' +
        'Ai-je clairement défini ce que je cède (données, marque, distribution, revenus) et dans quelles conditions je peux sortir ?',
      conviction_or_impulse: 'conviction',
    },

    3: {
      strengths:
        'Accès immédiat à une base clients, technologie ou canal de distribution complémentaire. ' +
        'Partage des risques et des coûts de développement. ' +
        'Synergies opérationnelles : production, R&D, achats. ' +
        'Légitimité et crédibilité renforcées grâce à l\'association de marque.',
      weaknesses:
        'Prise de décision ralentie par la nécessité d\'un consensus à deux. ' +
        'Risque de divergence stratégique sur la durée. ' +
        'Partage de revenus réduisant la marge individuelle. ' +
        'Dépendance : si le partenaire défaille, l\'activité est exposée.',
      opportunities:
        'Marchés géographiques ou segments inaccessibles seul. ' +
        'Réponses à des appels d\'offres nécessitant une taille critique. ' +
        'Accélération de la R&D par mutualisation des expertises. ' +
        'Création d\'une offre combinée différenciante face aux concurrents.',
      threats:
        'Conflit d\'intérêts latent si le partenaire développe une offre concurrente. ' +
        'Fuite de propriété intellectuelle ou de données clients. ' +
        'Déséquilibre de rapport de force si les tailles sont très différentes. ' +
        'Rupture du partenariat sans clause de sortie claire — litige coûteux.',
    },

    4: {
      financial_cost:
        'Frais juridiques (accord, JV, pacte d\'associés) : [X k€]. ' +
        'Investissement commun initial (infrastructure, développement, marketing) : [X k€] partagé. ' +
        'Part de revenus ou de marge cédée au partenaire : [X%]. ' +
        'Coût de coordination (ressources dédiées au suivi du partenariat) : [X ETP / X k€/an].',
      time_cost:
        'Négociation et due diligence mutuelles : 1-3 mois. ' +
        'Rédaction et signature des accords : 1-2 mois. ' +
        'Démarrage opérationnel effectif : 3-6 mois après signature. ' +
        'Revue de performance : trimestrielle + revue stratégique annuelle.',
      energy_cost:
        'Alignement constant nécessaire : réunions de gouvernance, reporting partagé, arbitrages. ' +
        'Gestion de la relation partenaire (confiance, transparence, escalades). ' +
        'Formation des équipes des deux côtés sur les offres communes.',
      relationship_impact:
        'Engagement de confidentialité mutuel (NDA). ' +
        'Engagement des dirigeants des deux structures. ' +
        'Impact potentiel sur d\'autres partenaires ou clients si exclusivité.',
      sacrifices:
        'Perte de pleine souveraineté sur les décisions concernant le périmètre partagé. ' +
        'Partage de données ou de savoir-faire sensibles. ' +
        'Dépendance à la réputation et aux performances du partenaire.',
      ready_to_pay: false,
    },

    5: {
      budget_detail:
        'Due diligence et conseil juridique : [X k€]. ' +
        'Mise en place de l\'infrastructure commune (SI, outils, process) : [X k€]. ' +
        'Budget marketing de lancement co-brandé : [X k€] (partagé). ' +
        'Ressource dédiée coordination partenariat : [X k€/an]. ' +
        'Fonds de réserve pour litiges ou renégociation : [X k€].',
      duration_estimate:
        'M1-M3 : négociation, due diligence, rédaction accords → ' +
        'M4-M6 : signature et phase de démarrage → ' +
        'M7-M12 : premières opérations communes et mesure de performance → ' +
        'M13+ : revue stratégique et décision de renouvellement ou extension.',
      milestones_draft: [
        { title: 'Term sheet signée — périmètre et partage de valeur validés', due_date: '' },
        { title: 'Due diligence mutuelle complétée sans blocant majeur', due_date: '' },
        { title: 'Accord cadre / contrat JV signé (avec clause de sortie)', due_date: '' },
        { title: 'Première opération conjointe livrée à un client commun', due_date: '' },
        { title: 'Première revue de performance — KPIs atteints à [X%]', due_date: '' },
      ],
    },

    6: {
      resources_available:
        'Offre produit ou service complémentaire à celle du partenaire. ' +
        'Réseau de clients ou marchés que le partenaire ne peut atteindre seul. ' +
        'Équipe juridique ou conseil pour la rédaction des accords. ' +
        'Références ou réputation valorisables dans la négociation.',
      resources_missing:
        'Conseil M&A ou JV spécialisé dans le secteur. ' +
        'Ressource dédiée à la gestion du partenariat. ' +
        'Système d\'information compatible ou API d\'intégration avec le SI partenaire.',
      decision: 'go',
      negotiation_plan:
        'Négociation sur la base d\'une proposition de valeur chiffrée pour les deux parties. ' +
        'Clause de revue à [12/24] mois avec option de sortie sans pénalité. ' +
        'Arbitrage exclusivité vs. non-exclusivité selon la valeur effective apportée.',
    },

    7: {
      success_criteria:
        'Le partenariat génère une valeur mesurable pour les deux parties, ' +
        'la gouvernance fonctionne sans escalade conflictuelle, ' +
        'les KPIs communs sont atteints et les deux équipes collaborent efficacement.',
      kpi_1: 'CA ou pipeline généré par le partenariat : [X k€] à M+12',
      kpi_2: '[X] clients communs actifs ou marchés ouverts à M+12',
      kpi_3: 'Satisfaction partenaire (NPS interne) ≥ [X] — revue trimestrielle',
      commitment_statement:
        'Je m\'engage à entrer dans ce partenariat avec une clause de sortie claire, ' +
        'à maintenir une transparence totale sur les métriques communes, ' +
        'et à revoir l\'accord annuellement pour l\'ajuster à la réalité terrain.',
      start_date: '',
    },
  },
}

// ─── Template 5 : Levée de fonds ─────────────────────────────

const FUNDRAISING: BusinessTemplate = {
  id: 'fundraising',
  name: 'Levée de fonds',
  icon: '💰',
  tagline: 'Seed · Série A · Business Angels · VC · BPI',
  description: 'Préparez et exécutez une levée de fonds : pitch, valorisation, due diligence et closing.',

  steps: {
    1: {
      title: 'Levée de fonds [X k€ / M€] — [Votre entreprise]',
      description:
        'Nous levons [X k€ / M€] auprès de [business angels / fonds seed / VC / BPI / crowdfunding equity] ' +
        'pour financer [objet précis : R&D, croissance commerciale, recrutement, internationalisation]. ' +
        'Stade : [pre-seed / seed / Série A]. ' +
        'Valorisation pre-money cible : [X M€]. ' +
        'Dilution acceptable : [X%]. ' +
        'Calendrier cible : closing dans [X mois].',
      success_image:
        'La levée est closée à [X k€ / M€], les fonds sont sur le compte, ' +
        'les investisseurs apportent du smart money (réseau, expertise), ' +
        'et l\'équipe peut exécuter le plan de croissance sur [X mois] sans pression de trésorerie.',
    },

    2: {
      reflection:
        'Ai-je besoin de lever maintenant, ou puis-je atteindre un palier de valeur supplémentaire en bootstrapping ' +
        'pour négocier une meilleure valorisation ? ' +
        'Suis-je prêt à accepter des investisseurs dans mon capital — avec les obligations de reporting, ' +
        'les droits de regard et la pression de performance que cela implique ? ' +
        'Ma traction actuelle est-elle suffisante pour convaincre les investisseurs ciblés ?',
      conviction_or_impulse: 'conviction',
    },

    3: {
      strengths:
        'Traction mesurable : [MRR, utilisateurs, LOI, partenariats]. ' +
        'Équipe complémentaire avec expertise rare et crédible. ' +
        'Marché adressable large (TAM > 1 Md€) et en croissance. ' +
        'Différenciation technologique ou positionnement défendable.',
      weaknesses:
        'Valorisation difficile à justifier en pré-revenue ou early stage. ' +
        'Temps et énergie de la levée détournés de l\'exécution produit/commercial. ' +
        'Dilution potentiellement importante si négociation défavorable. ' +
        'Dépendance au calendrier des fonds (comités d\'investissement, due diligence).',
      opportunities:
        'Investisseurs spécialisés dans le secteur apportant réseau et expertise (smart money). ' +
        'Programmes publics complémentaires (BPI, aides régionales, crédit impôt innovation). ' +
        'Fenêtre de marché favorable — concurrents peu capitalisés. ' +
        'Effet de signal : une levée renforce la crédibilité auprès des clients et recrutements.',
      threats:
        'Marché VC refroidi ou appétit risque réduit dans le secteur. ' +
        'Processus de due diligence révélant des faiblesses non anticipées. ' +
        'Contre-offre d\'un concurrent mieux valorisé attirant les mêmes investisseurs. ' +
        'Perte de contrôle si clauses de gouvernance mal négociées (droit de veto, liquidation préférentielle).',
    },

    4: {
      financial_cost:
        'Conseil levée de fonds / conseil juridique M&A : [X k€] ou success fee [2-5% des fonds levés]. ' +
        'Frais juridiques (pacte d\'associés, BSA, augmentation de capital) : [X k€]. ' +
        'Frais de data room et due diligence : [X k€]. ' +
        'Temps CEO/CFO dédié à la levée pendant [3-6 mois] : coût d\'opportunité significatif.',
      time_cost:
        'Préparation des documents (pitch, financial model, data room) : 4-8 semaines. ' +
        'Rencontres investisseurs et term sheets : 2-4 mois. ' +
        'Due diligence et closing : 1-3 mois supplémentaires. ' +
        'Total réaliste : 6-9 mois de process complet.',
      energy_cost:
        'CEO accaparé à 40-60% par la levée pendant toute la durée du process. ' +
        'Gestion des rejets (90%+ des approches n\'aboutissent pas). ' +
        'Maintien de la performance opérationnelle en parallèle de la levée.',
      relationship_impact:
        'Réseau personnel et professionnel mobilisé pour obtenir des introductions chaleureuses. ' +
        'Co-fondateurs impliqués dans les due diligences techniques et business. ' +
        'Clients et partenaires potentiellement sollicités comme références.',
      sacrifices:
        'Dilution du capital fondateur : [X%] cédé. ' +
        'Partage du contrôle décisionnel (droits de veto, approbation des grands postes). ' +
        'Pression de performance accrue — les investisseurs attendent un retour sur investissement.',
      ready_to_pay: false,
    },

    5: {
      budget_detail:
        'Budget de préparation (pitch deck, modèle financier, data room) : [X k€]. ' +
        'Conseil juridique et notaire : [X k€]. ' +
        'Success fee conseiller levée (si applicable) : [X% des fonds levés]. ' +
        'Fonds levés ciblés : [X M€]. ' +
        'Utilisation des fonds : [X%] R&D, [X%] commercial, [X%] recrutement, [X%] marketing.',
      duration_estimate:
        'S1-S8 : préparation (pitch, modèle, data room, sélection investisseurs) → ' +
        'M3-M6 : roadshow et premières term sheets → ' +
        'M6-M9 : due diligence, négociation, closing → ' +
        'M10+ : déploiement des fonds et exécution du plan.',
      milestones_draft: [
        { title: 'Pitch deck V1 finalisé et modèle financier validé', due_date: '' },
        { title: 'Data room complète et conseil juridique engagé', due_date: '' },
        { title: 'Première term sheet reçue', due_date: '' },
        { title: 'Due diligence investisseurs complétée sans blocant', due_date: '' },
        { title: 'Pacte d\'associés signé et augmentation de capital réalisée', due_date: '' },
        { title: 'Fonds disponibles sur le compte — plan de déploiement lancé', due_date: '' },
      ],
    },

    6: {
      resources_available:
        'Traction existante (MRR, utilisateurs, clients, LOI). ' +
        'Réseau d\'introduction auprès d\'investisseurs (alumni, accélérateurs, portfolio). ' +
        'Données financières historiques et modèle financier prévisionnel. ' +
        'Équipe fondatrice crédible avec track record.',
      resources_missing:
        'Conseil spécialisé levée de fonds ou avocat M&A. ' +
        'Accès à des fonds ou business angels spécialisés dans le secteur. ' +
        'CFO ou directeur financier pour structurer le modèle et la due diligence.',
      decision: 'go',
      negotiation_plan:
        'Créer de la compétition entre plusieurs investisseurs pour renforcer la position de négociation. ' +
        'Prioriser les fonds avec expertise sectorielle (smart money > argent neutre). ' +
        'Négocier les clauses de gouvernance autant que la valorisation.',
    },

    7: {
      success_criteria:
        'La levée est closée au montant et à la valorisation ciblés, ' +
        'les investisseurs apportent une valeur au-delà du capital (réseau, expertise, portes ouvertes), ' +
        'et les fonds permettent d\'atteindre le prochain palier de valeur sans stress de trésorerie.',
      kpi_1: 'Montant levé : [X M€] — dilution : [X%] — valorisation post-money : [X M€]',
      kpi_2: 'Runway après levée : ≥ 18 mois à burn rate actuel',
      kpi_3: 'Prochain palier de valeur atteint dans le délai : [indicateur précis] à [date]',
      commitment_statement:
        'Je m\'engage à lever auprès d\'investisseurs alignés sur ma vision long terme, ' +
        'à maintenir un reporting rigoureux et transparent, ' +
        'et à déployer les fonds strictement selon le plan validé au closing.',
      start_date: '',
    },
  },
}

// ─── Template 6 : Mission client / Prestation ─────────────────

const CLIENT_MISSION: BusinessTemplate = {
  id: 'client-mission',
  name: 'Mission client / Prestation',
  icon: '💼',
  tagline: 'Consulting · Prestation de service · Freelance · ESN',
  description: 'Cadrez et livrez une mission client avec excellence : scope, livrables, jalons et gestion des risques.',

  steps: {
    1: {
      title: 'Mission [Intitulé] — [Nom du client]',
      description:
        'Nous intervenons chez [Client] pour [intitulé de la mission : transformation digitale / audit / ' +
        'développement / conseil stratégique / formation / autre]. ' +
        'Périmètre : [ce qui est inclus explicitement]. ' +
        'Hors périmètre : [ce qui est exclu explicitement]. ' +
        'Durée : [X jours / semaines / mois]. ' +
        'Format : [présentiel / distanciel / hybride]. ' +
        'Interlocuteur principal : [Nom, Titre].',
      success_image:
        'La mission est livrée dans les délais, le client valide les livrables sans réserve majeure, ' +
        'la relation est renforcée, et le client ouvre la porte à une mission complémentaire ou nous recommande activement.',
    },

    2: {
      reflection:
        'Ce client et cette mission sont-ils alignés avec mon positionnement et mes ambitions à 2 ans — ' +
        'ou est-ce que j\'accepte par peur de manquer de revenus ? ' +
        'Le scope est-il suffisamment cadré pour livrer sans dérive ? ' +
        'Ai-je les compétences, la disponibilité et les ressources pour livrer avec excellence ?',
      conviction_or_impulse: 'conviction',
    },

    3: {
      strengths:
        'Expertise sectorielle ou technique directement applicable à la problématique client. ' +
        'Méthodologie éprouvée et réutilisable. ' +
        'Réactivité et agilité face à un grand compte plus rigide. ' +
        'Capacité à mobiliser un réseau d\'experts complémentaires si nécessaire.',
      weaknesses:
        'Dépendance à un interlocuteur unique — risque si changement d\'organisation chez le client. ' +
        'Scope creep potentiel si le cahier des charges est flou. ' +
        'Pression de délai incompatible avec la qualité si sous-estimé. ' +
        'Risque de sur-investissement en temps non facturé (phases de vente, avant-vente).',
      opportunities:
        'Mission pilote ouvrant un compte stratégique sur le long terme. ' +
        'Extension de périmètre si les premiers livrables dépassent les attentes. ' +
        'Référence client utilisable dans les prochains cycles commerciaux. ' +
        'Montée en compétence sur une problématique nouvelle valorisable sur le marché.',
      threats:
        'Retard ou blocage côté client (décideur indisponible, ressources non libérées). ' +
        'Changement de priorité interne chez le client en cours de mission. ' +
        'Litige sur la recette ou les livrables si critères non définis contractuellement. ' +
        'Sous-traitant ou prestataire parallèle client créant des conflits de recommandations.',
    },

    4: {
      financial_cost:
        'TJM appliqué : [X €/jour] × [X jours] = [X k€] HT. ' +
        'Frais refacturables (déplacements, hébergement, licences) : [X k€] ou forfait. ' +
        'Ressources mobilisées (sous-traitants, experts associés) : [X k€]. ' +
        'Coût d\'opportunité : CA manqué sur d\'autres clients pendant la mission.',
      time_cost:
        '[X jours] de production répartis sur [X semaines / mois]. ' +
        'Disponibilité client requise : [X h/semaine] pour comités, validations, ateliers. ' +
        'Buffer pour itérations et corrections : [X jours supplémentaires].',
      energy_cost:
        'Gestion de la relation client en parallèle de la production (communication, anticipation des frictions). ' +
        'Adaptation aux contraintes internes du client (processus, politique, culture). ' +
        'Maintien de la qualité sous pression de délai.',
      relationship_impact:
        'Engagement de confidentialité (NDA signé avant démarrage). ' +
        'Accès à des données sensibles du client — responsabilité accrue. ' +
        'Mobilisation potentielle d\'experts ou partenaires de confiance.',
      sacrifices:
        'Disponibilité réduite pour les autres clients ou projets internes. ' +
        'Revenus différés si paiement à 60 jours. ' +
        'Flexibilité limitée pendant la durée de la mission.',
      ready_to_pay: false,
    },

    5: {
      budget_detail:
        'Honoraires : [X k€] HT — [acompte X% à la signature, solde à la livraison / mensualités]. ' +
        'Frais de déplacement forfaitaires : [X k€]. ' +
        'Ressources sous-traitées : [X k€]. ' +
        'Révision de prix si extension de périmètre : avenant facturable.',
      duration_estimate:
        'S1 : kick-off et cadrage → S2-Sn : production et ateliers → ' +
        'Sn+1 : recette et corrections → Sn+2 : livraison finale et bilan de mission.',
      milestones_draft: [
        { title: 'Contrat / bon de commande signé et acompte reçu', due_date: '' },
        { title: 'Kick-off et plan de mission validés par le client', due_date: '' },
        { title: 'Livrable intermédiaire V1 remis et retours collectés', due_date: '' },
        { title: 'Livrable final remis — recette client lancée', due_date: '' },
        { title: 'Recette validée sans réserve bloquante', due_date: '' },
        { title: 'Solde facturé et bilan de mission réalisé', due_date: '' },
      ],
    },

    6: {
      resources_available:
        'Expertise et méthodologie prêtes à l\'emploi. ' +
        'Outils de travail (templates, livrables types, environnement de travail). ' +
        'Réseau d\'experts mobilisables pour des compétences complémentaires. ' +
        'Références et expériences similaires valorisables.',
      resources_missing:
        'Accès aux données et systèmes internes du client (droits à obtenir avant démarrage). ' +
        'Disponibilité des interlocuteurs clés chez le client (à cadrer contractuellement). ' +
        'Ressource complémentaire si pic de charge ou compétence manquante.',
      decision: 'go',
      negotiation_plan:
        'Contrat avec scope précis, critères de recette définis, et clause d\'avenant pour extensions. ' +
        'Paiement : acompte à la signature + jalons de facturation intermédiaires. ' +
        'Clause de résiliation avec préavis et indemnité de rupture.',
    },

    7: {
      success_criteria:
        'Tous les livrables sont remis dans les délais contractuels, validés par le client sans réserve majeure, ' +
        'le solde est encaissé, et le client exprime sa satisfaction formellement (NPS ou lettre de recommandation).',
      kpi_1: 'Délai de livraison : ≤ [date contractuelle] — zéro pénalité de retard',
      kpi_2: 'Satisfaction client (NPS ou note) ≥ [X/10] mesurée en clôture',
      kpi_3: 'Marge nette de la mission ≥ [X%] après tous frais',
      commitment_statement:
        'Je m\'engage à démarrer cette mission uniquement avec un contrat signé et un acompte reçu, ' +
        'à signaler toute dérive de scope immédiatement par avenant, ' +
        'et à maintenir une communication proactive avec le client tout au long de la mission.',
      start_date: '',
    },
  },
}

// ─── Export ──────────────────────────────────────────────────

export const BUSINESS_TEMPLATES: BusinessTemplate[] = [
  PRODUCT_LAUNCH,
  COMPANY_CREATION,
  REAL_ESTATE,
  PARTNERSHIP,
  FUNDRAISING,
  CLIENT_MISSION,
]

export function getTemplate(id: string): BusinessTemplate | undefined {
  return BUSINESS_TEMPLATES.find((t) => t.id === id)
}
