// DestinyPlanner — Dictionnaire français + définition du type Translations

export interface Translations {
  nav: {
    dashboard: string
    today:     string
    projects:  string
    journal:   string
    goal:      string
    domains:   string
    profile:   string
    settings:  string
    business:  string
    analytics: string
    life:      string
  }
  settings: {
    appearance:    string
    darkMode:      string
    lightMode:     string
    darkModeDesc:  string
    lightModeDesc: string
    language:      string
    languageName:  string
  }
  analytics: {
    title:          string
    subtitle:       string
    streak:         string
    bestStreak:     string
    projectsDone:   string
    actionsDone:    string
    journalCount:   string
    blocksCount:    string
    score30d:       string
    weeklyActivity: string
    domainHealth:   string
    healthy:        string
    dry:            string
    overloaded:     string
    dormant:        string
    days:           string
    noData:         string
  }
}

export const fr: Translations = {
  nav: {
    dashboard: 'Tableau de bord',
    today:     "Aujourd'hui",
    projects:  'Projets',
    journal:   'Journal',
    goal:      'But de vie',
    domains:   'Domaines',
    profile:   'Profil',
    settings:  'Paramètres',
    business:  'Business',
    analytics: 'Statistiques',
    life:      'Vie',
  },
  settings: {
    appearance:    'Apparence',
    darkMode:      'Mode sombre',
    lightMode:     'Mode clair',
    darkModeDesc:  'Interface sombre activée (par défaut)',
    lightModeDesc: 'Interface claire activée',
    language:      'Langue',
    languageName:  'Français',
  },
  analytics: {
    title:          'Statistiques',
    subtitle:       'Usage local — espace personnel uniquement',
    streak:         'Streak actuel',
    bestStreak:     'Meilleur streak',
    projectsDone:   'Projets terminés',
    actionsDone:    'Actions faites',
    journalCount:   'Entrées journal',
    blocksCount:    'Blocs respectés',
    score30d:       'Score moy. 30j',
    weeklyActivity: 'Activité hebdomadaire',
    domainHealth:   'Santé des domaines',
    healthy:        'Sains',
    dry:            'Desséchés',
    overloaded:     'Surchargés',
    dormant:        'Endormis',
    days:           'j',
    noData:         'Aucune donnée disponible.',
  },
}
