// DestinyPlanner — Calcul du statut de santé d'un domaine
// Statuts : healthy / dry / overloaded / dormant
// Les projets business liés (PersonalBusinessLink) comptent dans le calcul (v2.0+)

import type { Domain, Project, PersonalBusinessLink, DomainHealthStatus, DomainWithHealth } from '../types'

// Seuils de santé (doc Design §2.7)
const OVERLOADED_THRESHOLD = 3   // >= 3 projets actifs → surchargé
const DORMANT_THRESHOLD = 0      // 0 projet du tout → endormi

function computeHealthStatus(
  activeCount: number,
  totalCount: number,
): DomainHealthStatus {
  if (activeCount >= OVERLOADED_THRESHOLD) return 'overloaded'
  if (activeCount >= 1) return 'healthy'
  if (totalCount > DORMANT_THRESHOLD) return 'dry'
  return 'dormant'
}

export function computeDomainHealth(
  domain: Domain,
  projects: Project[],
  businessLinks: PersonalBusinessLink[] = [],
): DomainWithHealth {
  const domainProjects = projects.filter((p) => p.domain_id === domain.id)
  const activePersonal = domainProjects.filter(
    (p) => p.status === 'active' || p.status === 'paused',
  )

  const domainLinks = businessLinks.filter((l) => l.domain_id === domain.id)
  const activeBusiness = domainLinks.filter(
    (l) => l.business_project_status === 'active' || l.business_project_status === 'paused',
  )

  const activeCount = activePersonal.length + activeBusiness.length
  const totalCount = domainProjects.length + domainLinks.length

  const health_status = computeHealthStatus(activeCount, totalCount)

  return {
    ...domain,
    health_status,
    active_projects_count: activeCount,
  }
}

export function computeAllDomainsHealth(
  domains: Domain[],
  projects: Project[],
  businessLinks: PersonalBusinessLink[] = [],
): DomainWithHealth[] {
  return domains.map((domain) => computeDomainHealth(domain, projects, businessLinks))
}
