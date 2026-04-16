// DestinyPlanner — Schéma Dexie v1.2
// 3 versions empilées — ne jamais supprimer une version

import Dexie, { type Table } from 'dexie'
import type {
  Goal,
  Domain,
  Project,
  ProjectStep,
  Milestone,
  Action,
  TimeBlock,
  Detour,
  JournalEntry,
  Habit,
  HabitCheck,
  UserProfile,
  PersonalBusinessLink,
  AppPreferences,
  BackupMeta,
} from '../types'
import { migrateV2ToV3 } from './migrations'

// Cache local pour l'espace business (lecture offline — jamais source de vérité)
export interface BusinessProjectCache {
  id: string
  owner_id: string
  title: string
  description: string
  current_step: number
  status: string
  progress: number
  template_id: string | null
  created_at: string
  updated_at: string
  cached_at: string  // horodatage local du cache
}

class DestinyPlannerDB extends Dexie {
  goal!: Table<Goal, string>
  domain!: Table<Domain, string>
  project!: Table<Project, string>
  project_step!: Table<ProjectStep, string>
  milestone!: Table<Milestone, string>
  action!: Table<Action, string>
  time_block!: Table<TimeBlock, string>
  detour!: Table<Detour, string>
  journal_entry!: Table<JournalEntry, string>
  habit!: Table<Habit, string>
  habit_check!: Table<HabitCheck, string>
  user_profile!: Table<UserProfile, string>
  personal_business_link!: Table<PersonalBusinessLink, string>
  app_preferences!: Table<AppPreferences, string>
  backup_meta!: Table<BackupMeta, string>
  business_project_cache!: Table<BusinessProjectCache, string>

  constructor() {
    super('DestinyPlanner')

    // Version 1 — MVP perso
    this.version(1).stores({
      goal:            'id',
      domain:          'id, sort_order',
      project:         'id, domain_id, status, current_step, created_at',
      project_step:    'id, project_id, step_number, status',
      milestone:       'id, project_id, status, due_date, sort_order',
      action:          'id, milestone_id, date, done',
      detour:          'id, project_id, date, resolved, is_systemic',
      journal_entry:   'id',
      habit:           'id, active, sort_order',
      habit_check:     'id, habit_id, date',
      app_preferences: 'id',
      backup_meta:     'id',
    })

    // Version 2 — Ajout personal_business_link (v2.0)
    this.version(2).stores({
      goal:                   'id',
      domain:                 'id, sort_order',
      project:                'id, domain_id, status, current_step, created_at',
      project_step:           'id, project_id, step_number, status',
      milestone:              'id, project_id, status, due_date, sort_order',
      action:                 'id, milestone_id, date, done',
      detour:                 'id, project_id, date, resolved, is_systemic',
      journal_entry:          'id',
      habit:                  'id, active, sort_order',
      habit_check:            'id, habit_id, date',
      personal_business_link: 'id, goal_id, domain_id',
      app_preferences:        'id',
      backup_meta:            'id',
    })

    // Version 3 — Ajout time_block + user_profile + migration app_preferences (v1.2)
    this.version(3)
      .stores({
        goal:                   'id',
        domain:                 'id, sort_order',
        project:                'id, domain_id, status, current_step, created_at',
        project_step:           'id, project_id, step_number, status',
        milestone:              'id, project_id, status, due_date, sort_order',
        action:                 'id, milestone_id, date, done',
        time_block:             'id, date, start_time, action_id, done',
        detour:                 'id, project_id, date, resolved, is_systemic',
        journal_entry:          'id',
        habit:                  'id, active, sort_order',
        habit_check:            'id, habit_id, date',
        user_profile:           'id',
        personal_business_link: 'id, goal_id, domain_id',
        app_preferences:        'id',
        backup_meta:            'id',
      })
      .upgrade(migrateV2ToV3)

    // Version 4 — Cache business (v2.0) : lecture offline espace collaboratif
    this.version(4).stores({
      goal:                    'id',
      domain:                  'id, sort_order',
      project:                 'id, domain_id, status, current_step, created_at',
      project_step:            'id, project_id, step_number, status',
      milestone:               'id, project_id, status, due_date, sort_order',
      action:                  'id, milestone_id, date, done',
      time_block:              'id, date, start_time, action_id, done',
      detour:                  'id, project_id, date, resolved, is_systemic',
      journal_entry:           'id',
      habit:                   'id, active, sort_order',
      habit_check:             'id, habit_id, date',
      user_profile:            'id',
      personal_business_link:  'id, goal_id, domain_id',
      app_preferences:         'id',
      backup_meta:             'id',
      business_project_cache:  'id, owner_id, status, cached_at',
    })

    // Version 5 — tutorial_done sur user_profile (aucun changement structurel)
    this.version(5).stores({
      goal:                    'id',
      domain:                  'id, sort_order',
      project:                 'id, domain_id, status, current_step, created_at',
      project_step:            'id, project_id, step_number, status',
      milestone:               'id, project_id, status, due_date, sort_order',
      action:                  'id, milestone_id, date, done',
      time_block:              'id, date, start_time, action_id, done',
      detour:                  'id, project_id, date, resolved, is_systemic',
      journal_entry:           'id',
      habit:                   'id, active, sort_order',
      habit_check:             'id, habit_id, date',
      user_profile:            'id',
      personal_business_link:  'id, goal_id, domain_id',
      app_preferences:         'id',
      backup_meta:             'id',
      business_project_cache:  'id, owner_id, status, cached_at',
    })
  }
}

export const db = new DestinyPlannerDB()
